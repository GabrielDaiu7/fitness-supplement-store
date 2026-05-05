import { pool } from './pool';

const products = [
  { id: 1, name: 'Impact Whey Protein', category: 'Protein', price: 34.99, description: 'Fast-digesting whey for muscle recovery.', image: '/images/whey.svg' },
  { id: 2, name: 'Micronized Creatine', category: 'Creatine', price: 18.99, description: 'Pure creatine monohydrate for power output.', image: '/images/creatine.svg' },
  { id: 3, name: 'Pre-Workout Ignite', category: 'Pre-Workout', price: 29.99, description: 'Energy and focus blend before training.', image: '/images/preworkout.svg' },
  { id: 4, name: 'Daily Multivitamin', category: 'Vitamins', price: 14.99, description: 'Daily health support with essential micronutrients.', image: '/images/vitamins.svg' },
  { id: 5, name: 'Steel Shaker Bottle', category: 'Accessories', price: 12.99, description: 'Durable leakproof shaker for gym use.', image: '/images/shaker.svg' },
];

async function seed() {
  await pool.query('TRUNCATE TABLE products RESTART IDENTITY;');

  for (const product of products) {
    await pool.query(
      `
      INSERT INTO products (id, name, category, price, description, image)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        category = EXCLUDED.category,
        price = EXCLUDED.price,
        description = EXCLUDED.description,
        image = EXCLUDED.image;
      `,
      [product.id, product.name, product.category, product.price, product.description, product.image]
    );
  }

  console.log('Database seeded with products.');
}

seed()
  .catch((error) => {
    console.error('Failed to seed database:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
