"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkHealth = checkHealth;
exports.listProducts = listProducts;
exports.getProductDetails = getProductDetails;
exports.listCategories = listCategories;
const pool_1 = require("../db/pool");
async function checkHealth() {
    await pool_1.pool.query('SELECT 1');
}
async function listProducts(params) {
    const filters = ['price BETWEEN $1 AND $2'];
    const queryParams = [params.minPrice, params.maxPrice];
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
    const result = await pool_1.pool.query(`SELECT id, name, brand, category, flavor, servings, price, description, image, images, ingredients, usage, faqs, reviews, goals, in_stock as "inStock",
            featured, certifications
     FROM products
     WHERE ${filters.join(' AND ')}
     ORDER BY featured DESC, id ASC`, queryParams);
    return result.rows;
}
async function getProductDetails(productId) {
    const productResult = await pool_1.pool.query(`SELECT id, name, brand, category, flavor, servings, price, description, image, images, ingredients, usage, faqs, reviews, goals, in_stock as "inStock",
            featured, certifications
     FROM products WHERE id = $1`, [productId]);
    const product = productResult.rows[0];
    if (!product) {
        return null;
    }
    const related = await pool_1.pool.query(`SELECT id, name, brand, category, flavor, servings, price, description, image, images, ingredients, usage, faqs, reviews, goals, in_stock as "inStock",
            featured, certifications
     FROM products
     WHERE category = $1 AND id != $2
     ORDER BY featured DESC, id ASC
     LIMIT 4`, [product.category, productId]);
    return { ...product, relatedProducts: related.rows };
}
async function listCategories() {
    const result = await pool_1.pool.query('SELECT DISTINCT category FROM products ORDER BY category ASC');
    return result.rows.map((row) => row.category);
}
