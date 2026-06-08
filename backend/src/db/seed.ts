import { pool } from './pool';
import bcrypt from 'bcryptjs';

const products = [
  {
    id: 1,
    name: 'Whey Protein Isolate 2lb - Vanilla',
    category: 'Protein',
    price: 49.99,
    description: 'Ultra-filtered whey isolate delivering 25g protein per serving with low carbs and fast absorption.',
    image: '/images/products/whey-main.svg',
    ingredients: ['Whey Protein Isolate', 'Natural Vanilla Flavor', 'Sunflower Lecithin', 'Sea Salt', 'Stevia Leaf Extract'],
    usage: 'Mix 1 scoop with 250ml cold water. Use post-workout or anytime you need extra protein.',
    faqs: [{ q: 'How much protein per serving?', a: 'Each scoop delivers 25g of protein.' }],
    reviews: [
      { name: 'Daniel', rating: 5, text: 'Mixes smooth and tastes clean, perfect after lifting.' },
      { name: 'Chris', rating: 5, text: 'Great isolate for cutting, no bloating at all.' },
      { name: 'Noah', rating: 4, text: 'Very good vanilla flavor and solid recovery.' },
    ],
    goals: ['muscle', 'recovery'],
    inStock: true,
    featured: true,
    certifications: ['Third-Party Tested', 'GMP Certified'],
  },
  {
    id: 2,
    name: 'Creatine Monohydrate 500g',
    category: 'Creatine',
    price: 24.99,
    description: 'Micronized creatine monohydrate to support strength, power output, and muscle performance.',
    image: '/images/products/creatine-main.svg',
    ingredients: ['Creatine Monohydrate'],
    usage: 'Take 5g daily with water or a shake. Consistency is more important than timing.',
    faqs: [{ q: 'Do I need a loading phase?', a: 'Loading is optional. 3-5g daily works well for most users.' }],
    reviews: [
      { name: 'Marco', rating: 5, text: 'Noticeable strength and better training volume.' },
      { name: 'Ethan', rating: 5, text: 'Mixes clear and works exactly as expected.' },
      { name: 'Luca', rating: 4, text: 'Good value and real progress after two weeks.' },
    ],
    goals: ['muscle', 'recovery'],
    inStock: true,
    featured: true,
    certifications: ['Lab Tested', 'Banned Substance Screened'],
  },
  {
    id: 3,
    name: 'Pre-Workout Focus+ - Berry',
    category: 'Pre-Workout',
    price: 39.99,
    description: 'Performance pre-workout with caffeine, citrulline, and beta-alanine for energy and pump.',
    image: '/images/products/preworkout-main.svg',
    ingredients: ['Citrulline Malate', 'Beta-Alanine', 'Caffeine Anhydrous', 'L-Tyrosine', 'Electrolytes'],
    usage: 'Take 1 scoop 20-30 minutes before training. Start with half scoop for tolerance.',
    faqs: [{ q: 'Can I take it at night?', a: 'Not recommended because it contains caffeine.' }],
    reviews: [
      { name: 'Rayan', rating: 4, text: 'Strong focus and clean energy for hard sessions.' },
      { name: 'Adam', rating: 5, text: 'Great pump and no crash after workouts.' },
      { name: 'Khaled', rating: 4, text: 'Flavor is solid and focus is very noticeable.' },
    ],
    goals: ['fat-loss', 'muscle'],
    inStock: true,
    featured: true,
    certifications: ['Third-Party Tested'],
  },
  {
    id: 4,
    name: 'Daily Multivitamin Complex',
    category: 'Vitamins',
    price: 19.99,
    description: 'Complete vitamin and mineral support formulated for active lifestyles and daily wellness.',
    image: '/images/products/multi-main.svg',
    ingredients: ['Vitamin A', 'Vitamin C', 'Vitamin D3', 'Vitamin B Complex', 'Magnesium', 'Zinc'],
    usage: 'Take 2 capsules daily with food and water.',
    faqs: [{ q: 'Is this vegan?', a: 'Yes, the capsules are plant-based.' }],
    reviews: [
      { name: 'Nora', rating: 5, text: 'Simple daily support and gentle on my stomach.' },
      { name: 'Sophie', rating: 4, text: 'Good all-round formula for daily use.' },
      { name: 'Helen', rating: 5, text: 'Easy routine and I feel more consistent energy.' },
    ],
    goals: ['recovery', 'fat-loss'],
    inStock: true,
    featured: false,
    certifications: ['GMP Certified'],
  },
  {
    id: 5,
    name: 'Omega-3 Fish Oil 120 Softgels',
    category: 'Vitamins',
    price: 21.99,
    description: 'Concentrated EPA and DHA omega-3 support for heart, brain, and joint health.',
    image: '/images/products/omega-main.svg',
    ingredients: ['Fish Oil Concentrate', 'EPA', 'DHA', 'Natural Tocopherols'],
    usage: 'Take 2 softgels daily with meals.',
    faqs: [{ q: 'Any fishy aftertaste?', a: 'Minimal aftertaste when taken with food.' }],
    reviews: [
      { name: 'Youssef', rating: 5, text: 'Great quality and easy to digest.' },
      { name: 'Mason', rating: 4, text: 'No fishy burps, good omega concentration.' },
      { name: 'Leo', rating: 5, text: 'Excellent softgels and clean profile.' },
    ],
    goals: ['recovery'],
    inStock: true,
    featured: false,
    certifications: ['IFOS Tested', 'GMP Certified'],
  },
  {
    id: 6,
    name: 'Electrolyte Hydration Mix - Lemon',
    category: 'Hydration',
    price: 27.99,
    description: 'Sugar-free hydration formula with sodium, potassium, and magnesium for training and recovery.',
    image: '/images/products/electro-main.svg',
    ingredients: ['Sodium', 'Potassium', 'Magnesium', 'Calcium', 'Natural Lemon Flavor', 'Stevia'],
    usage: 'Mix 1 scoop in 500-700ml water during or after training.',
    faqs: [{ q: 'Can I drink it daily?', a: 'Yes, especially on active days or in hot weather.' }],
    reviews: [
      { name: 'Lea', rating: 4, text: 'Excellent for long sessions and summer workouts.' },
      { name: 'Emma', rating: 5, text: 'Hydration is much better during cardio sessions.' },
      { name: 'Victor', rating: 4, text: 'Light flavor and effective electrolyte balance.' },
    ],
    goals: ['recovery', 'fat-loss'],
    inStock: true,
    featured: true,
    certifications: ['Lab Tested'],
  },
  {
    id: 7,
    name: 'Casein Protein Night Blend - Chocolate',
    category: 'Protein',
    price: 44.99,
    description: 'Slow-digesting casein protein designed for sustained amino acid release between meals or overnight.',
    image: '/images/products/casein-main.svg',
    ingredients: ['Micellar Casein', 'Cocoa Powder', 'Natural Flavor', 'Sea Salt', 'Sucralose'],
    usage: 'Mix 1 scoop with 300ml water or milk before bed.',
    faqs: [{ q: 'How is this different from whey?', a: 'Casein digests slower, making it ideal for longer gaps without food.' }],
    reviews: [
      { name: 'Ivan', rating: 5, text: 'Thick texture and keeps me full overnight.' },
      { name: 'Ben', rating: 4, text: 'Great before bed and nice chocolate taste.' },
      { name: 'Owen', rating: 5, text: 'Recovery is better when I use this consistently.' },
    ],
    goals: ['muscle', 'recovery'],
    inStock: true,
    featured: false,
    certifications: ['Third-Party Tested'],
  },
  {
    id: 8,
    name: 'Mass Gainer Pro 6lb - Chocolate',
    category: 'Weight Gainer',
    price: 59.99,
    description: 'High-calorie protein and carb blend built for hard gainers targeting lean size and recovery.',
    image: '/images/products/gainer-main.svg',
    ingredients: ['Whey Protein Concentrate', 'Oat Flour', 'Maltodextrin', 'Coconut Oil Powder', 'Digestive Enzymes'],
    usage: 'Blend 2 scoops with 500ml water or milk between meals or post-workout.',
    faqs: [{ q: 'Is this suitable for bulking?', a: 'Yes, it is formulated to increase calories and support weight gain.' }],
    reviews: [
      { name: 'Sam', rating: 4, text: 'Helped me increase calories without feeling heavy.' },
      { name: 'Jacob', rating: 5, text: 'Perfect for bulking, easy to hit calorie goals.' },
      { name: 'Ryan', rating: 4, text: 'Good texture for a gainer and digests well.' },
    ],
    goals: ['muscle'],
    inStock: true,
    featured: false,
    certifications: ['GMP Certified'],
  },
  {
    id: 9,
    name: 'L-Glutamine Recovery Powder',
    category: 'Recovery',
    price: 22.99,
    description: 'Pure L-glutamine powder to support post-workout recovery and muscle repair.',
    image: '/images/products/glutamine-main.svg',
    ingredients: ['L-Glutamine'],
    usage: 'Take 5g after training or before bedtime.',
    faqs: [{ q: 'Can I stack it with whey and creatine?', a: 'Yes, glutamine can be combined with both.' }],
    reviews: [
      { name: 'Alicia', rating: 4, text: 'Clean product and easy to add to shakes.' },
      { name: 'Mila', rating: 5, text: 'Great recovery support after intense workouts.' },
      { name: 'Hugo', rating: 4, text: 'Simple formula and zero taste, easy stack.' },
    ],
    goals: ['recovery', 'muscle'],
    inStock: true,
    featured: false,
    certifications: ['Lab Tested'],
  },
  {
    id: 10,
    name: 'Vegan Protein Blend - Salted Caramel',
    category: 'Protein',
    price: 42.99,
    description: 'Plant-based protein from pea and rice with complete amino profile and smooth texture.',
    image: '/images/products/vegan-main.svg',
    ingredients: ['Pea Protein Isolate', 'Brown Rice Protein', 'Natural Caramel Flavor', 'Sea Salt', 'Stevia'],
    usage: 'Mix 1 scoop with 300ml water, almond milk, or oat milk.',
    faqs: [{ q: 'Is this dairy free?', a: 'Yes, this formula contains no dairy ingredients.' }],
    reviews: [
      { name: 'Maya', rating: 5, text: 'Best vegan protein texture I have tried.' },
      { name: 'Ava', rating: 5, text: 'Tastes great and blends better than most plant proteins.' },
      { name: 'Oliver', rating: 4, text: 'Very good flavor and no chalky aftertaste.' },
    ],
    goals: ['muscle', 'fat-loss'],
    inStock: true,
    featured: true,
    certifications: ['Vegan', 'Third-Party Tested'],
  },
];

async function seed() {
  await pool.query('TRUNCATE TABLE order_items, orders, addresses, refresh_tokens, users, products RESTART IDENTITY CASCADE;');

  for (const product of products) {
    const alternateImagesById: Record<number, string> = {
      1: '/images/products/whey-alt.svg',
      2: '/images/products/creatine-alt.svg',
      3: '/images/products/preworkout-alt.svg',
      4: '/images/products/multi-alt.svg',
      5: '/images/products/omega-alt.svg',
      6: '/images/products/electro-alt.svg',
      7: '/images/products/casein-alt.svg',
      8: '/images/products/gainer-alt.svg',
      9: '/images/products/glutamine-alt.svg',
      10: '/images/products/vegan-alt.svg',
    };
    const brand = 'Fusion Labs';
    const flavor = product.name.includes('Vanilla')
      ? 'Vanilla'
      : product.name.includes('Chocolate')
        ? 'Chocolate'
        : product.name.includes('Lemon')
          ? 'Lemon'
          : product.name.includes('Berry')
            ? 'Berry'
            : product.name.includes('Caramel')
              ? 'Salted Caramel'
              : 'Unflavored';
    const servings = product.category === 'Weight Gainer' ? 16 : product.category === 'Protein' ? 30 : 60;
    const images = [product.image, alternateImagesById[product.id]].filter(Boolean);
    const stockQuantity = product.id === 3 ? 4 : product.id === 8 ? 0 : 18 + product.id;
    const supplementFacts = {
      servingSize: product.category === 'Vitamins' ? '2 capsules' : '1 scoop',
      servingsPerContainer: servings,
      highlights:
        product.category === 'Protein'
          ? ['25g protein', 'Low sugar', 'Fast mixing']
          : product.category === 'Creatine'
            ? ['5g creatine monohydrate', 'Unflavored', 'Micronized']
            : product.category === 'Pre-Workout'
              ? ['Caffeine', 'Citrulline', 'Beta-alanine']
              : product.ingredients.slice(0, 3),
    };

    await pool.query(
      `
      INSERT INTO products (id, name, brand, category, flavor, servings, price, description, image, images, ingredients, usage, faqs, reviews, goals, in_stock, stock_quantity, low_stock_threshold, featured, supplement_facts, certifications)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12, $13::jsonb, $14::jsonb, $15::jsonb, $16, $17, $18, $19, $20::jsonb, $21::jsonb)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        brand = EXCLUDED.brand,
        category = EXCLUDED.category,
        flavor = EXCLUDED.flavor,
        servings = EXCLUDED.servings,
        price = EXCLUDED.price,
        description = EXCLUDED.description,
        image = EXCLUDED.image,
        images = EXCLUDED.images,
        ingredients = EXCLUDED.ingredients,
        usage = EXCLUDED.usage,
        faqs = EXCLUDED.faqs,
        reviews = EXCLUDED.reviews,
        goals = EXCLUDED.goals,
        in_stock = EXCLUDED.in_stock,
        stock_quantity = EXCLUDED.stock_quantity,
        low_stock_threshold = EXCLUDED.low_stock_threshold,
        featured = EXCLUDED.featured,
        supplement_facts = EXCLUDED.supplement_facts,
        certifications = EXCLUDED.certifications;
      `,
      [
        product.id,
        product.name,
        brand,
        product.category,
        flavor,
        servings,
        product.price,
        product.description,
        product.image,
        JSON.stringify(images),
        JSON.stringify(product.ingredients),
        product.usage,
        JSON.stringify(product.faqs),
        JSON.stringify(product.reviews),
        JSON.stringify(product.goals),
        stockQuantity > 0 && product.inStock,
        stockQuantity,
        5,
        product.featured,
        JSON.stringify(supplementFacts),
        JSON.stringify(product.certifications),
      ]
    );
  }

  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  await pool.query(
    'INSERT INTO users (name, email, password_hash, is_admin) VALUES ($1, $2, $3, true)',
    ['Fusion Admin', 'admin@fusion.store', adminPasswordHash]
  );

  await pool.query(
    `INSERT INTO coupons (code, description, discount_percent, min_subtotal, active)
     VALUES ($1, $2, $3, $4, true)
     ON CONFLICT (code) DO UPDATE SET
       description = EXCLUDED.description,
       discount_percent = EXCLUDED.discount_percent,
       min_subtotal = EXCLUDED.min_subtotal,
       active = EXCLUDED.active`,
    ['FUSION10', 'Launch offer for first-time shoppers', 10, 0]
  );

  console.log('Database seeded with products and admin user.');
}

seed()
  .catch((error) => {
    console.error('Failed to seed database:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
