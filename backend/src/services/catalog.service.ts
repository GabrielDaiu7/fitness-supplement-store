import { pool } from '../db/pool';

export async function checkHealth() {
  await pool.query('SELECT 1');
}

type ProductRow = {
  id: number;
  reviews?: Array<{ name: string; rating: number; text: string; verifiedPurchase?: boolean; createdAt?: string }>;
};

async function attachSubmittedReviews<T extends ProductRow>(products: T[]): Promise<T[]> {
  if (!products.length) return products;
  const ids = products.map((product) => product.id);
  const result = await pool.query(
    `SELECT pr.product_id as "productId", u.name, pr.rating, pr.text,
            pr.verified_purchase as "verifiedPurchase", pr.created_at as "createdAt"
     FROM product_reviews pr
     JOIN users u ON u.id = pr.user_id
     WHERE pr.product_id = ANY($1::int[]) AND pr.status = 'approved'
     ORDER BY pr.created_at DESC`,
    [ids]
  );
  const byProduct = new Map<number, Array<{ name: string; rating: number; text: string; verifiedPurchase: boolean; createdAt: string }>>();
  for (const row of result.rows) {
    const productId = Number(row.productId);
    const current = byProduct.get(productId) ?? [];
    current.push({
      name: row.name,
      rating: Number(row.rating),
      text: row.text,
      verifiedPurchase: Boolean(row.verifiedPurchase),
      createdAt: row.createdAt,
    });
    byProduct.set(productId, current);
  }
  return products.map((product) => ({
    ...product,
    reviews: [...(product.reviews ?? []), ...(byProduct.get(product.id) ?? [])],
  }));
}

export async function listProducts(params: {
  search: string;
  minPrice: number;
  maxPrice: number;
  goal: string;
  inStockOnly: boolean;
  category: string;
}) {
  const filters: string[] = ['price BETWEEN $1 AND $2'];
  const queryParams: unknown[] = [params.minPrice, params.maxPrice];

  if (params.search) {
    queryParams.push(`%${params.search.toLowerCase()}%`);
    filters.push(`LOWER(name) LIKE $${queryParams.length}`);
  }
  if (params.goal) {
    queryParams.push(params.goal.toLowerCase());
    filters.push(`goals @> to_jsonb(ARRAY[$${queryParams.length}]::text[])`);
  }
  if (params.inStockOnly) {
    filters.push('in_stock = true');
  }
  if (params.category) {
    queryParams.push(params.category);
    filters.push(`category = $${queryParams.length}`);
  }

  const result = await pool.query(
    `SELECT id, name, brand, category, flavor, servings, price, description, image, images, ingredients, usage, faqs, reviews, goals, in_stock as "inStock",
            stock_quantity as "stockQuantity", low_stock_threshold as "lowStockThreshold", featured,
            supplement_facts as "supplementFacts", certifications
     FROM products
     WHERE ${filters.join(' AND ')}
     ORDER BY featured DESC, id ASC`,
    queryParams
  );

  return attachSubmittedReviews(result.rows);
}

export async function getProductDetails(productId: number) {
  const productResult = await pool.query(
    `SELECT id, name, brand, category, flavor, servings, price, description, image, images, ingredients, usage, faqs, reviews, goals, in_stock as "inStock",
            stock_quantity as "stockQuantity", low_stock_threshold as "lowStockThreshold", featured,
            supplement_facts as "supplementFacts", certifications
     FROM products WHERE id = $1`,
    [productId]
  );

  const product = productResult.rows[0];
  if (!product) {
    return null;
  }

  const related = await pool.query(
    `SELECT id, name, brand, category, flavor, servings, price, description, image, images, ingredients, usage, faqs, reviews, goals, in_stock as "inStock",
            stock_quantity as "stockQuantity", low_stock_threshold as "lowStockThreshold", featured,
            supplement_facts as "supplementFacts", certifications
     FROM products
     WHERE category = $1 AND id != $2
     ORDER BY featured DESC, id ASC
     LIMIT 4`,
    [product.category, productId]
  );

  const [enrichedProduct] = await attachSubmittedReviews([product]);
  const relatedProducts = await attachSubmittedReviews(related.rows);
  return { ...enrichedProduct, relatedProducts };
}

export async function listCategories() {
  const result = await pool.query('SELECT DISTINCT category FROM products ORDER BY category ASC');
  return result.rows.map((row) => row.category as string);
}

export async function subscribeNewsletter(email: string, source = 'footer') {
  const couponCode = 'FUSION10';
  const result = await pool.query(
    `INSERT INTO newsletter_subscribers (email, source, coupon_code)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET source = EXCLUDED.source
     RETURNING email, coupon_code as "couponCode", created_at as "createdAt"`,
    [email, source, couponCode]
  );
  return result.rows[0] as { email: string; couponCode: string; createdAt: string };
}

export async function createVerifiedProductReview(userId: number, productId: number, rating: number, text: string) {
  const purchase = await pool.query(
    `SELECT oi.id
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE o.user_id = $1 AND oi.product_id = $2 AND o.status != 'cancelled'
     LIMIT 1`,
    [userId, productId]
  );
  if (!purchase.rows[0]) {
    return null;
  }
  const result = await pool.query(
    `INSERT INTO product_reviews (product_id, user_id, rating, text, verified_purchase)
     VALUES ($1, $2, $3, $4, true)
     ON CONFLICT (product_id, user_id) DO UPDATE SET
       rating = EXCLUDED.rating,
       text = EXCLUDED.text,
       verified_purchase = true,
       status = 'approved',
       created_at = now()
     RETURNING rating, text, verified_purchase as "verifiedPurchase", created_at as "createdAt"`,
    [productId, userId, rating, text]
  );
  const user = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
  return { name: user.rows[0]?.name ?? 'Verified Buyer', ...result.rows[0] };
}
