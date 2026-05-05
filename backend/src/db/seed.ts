import { pool } from './pool';
import bcrypt from 'bcryptjs';

const products = [
  {
    id: 1,
    name: 'Impact Whey Protein',
    category: 'Protein',
    price: 34.99,
    description: 'Fast-digesting whey for muscle recovery.',
    image: 'https://images.unsplash.com/photo-1579722821273-0f6c0a6f8f3a?auto=format&fit=crop&w=900&q=80',
    ingredients: ['Whey Protein Isolate', 'Whey Concentrate', 'Natural Flavor', 'Stevia'],
    usage: 'Mix one scoop with 250-300ml water after training or between meals.',
    faqs: [{ q: 'Is it lactose free?', a: 'It is low lactose, but not fully lactose free.' }],
    reviews: [{ name: 'Ahmed', rating: 5, text: 'Excellent recovery and taste.' }],
    goals: ['muscle', 'recovery'],
    inStock: true,
    featured: true,
    certifications: ['Lab Tested', 'Informed Choice'],
  },
  {
    id: 2,
    name: 'Micronized Creatine',
    category: 'Creatine',
    price: 18.99,
    description: 'Pure creatine monohydrate for power output.',
    image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=900&q=80',
    ingredients: ['Creatine Monohydrate'],
    usage: 'Take 5g daily, before or after workout.',
    faqs: [{ q: 'Do I need a loading phase?', a: 'Optional. Daily use is enough for most users.' }],
    reviews: [{ name: 'Lina', rating: 5, text: 'Strength gains in 2 weeks.' }],
    goals: ['muscle', 'recovery'],
    inStock: true,
    featured: true,
    certifications: ['Lab Tested'],
  },
  {
    id: 3,
    name: 'Pre-Workout Ignite',
    category: 'Pre-Workout',
    price: 29.99,
    description: 'Energy and focus blend before training.',
    image: 'https://images.unsplash.com/photo-1608500218808-3b01d4d88f2c?auto=format&fit=crop&w=900&q=80',
    ingredients: ['Caffeine', 'Citrulline Malate', 'Beta-Alanine', 'L-Tyrosine'],
    usage: 'Take one scoop 20-30 minutes before training.',
    faqs: [{ q: 'Can I take it at night?', a: 'Not recommended due to caffeine content.' }],
    reviews: [{ name: 'Mina', rating: 4, text: 'Great energy and no crash.' }],
    goals: ['fat-loss', 'muscle'],
    inStock: true,
    featured: true,
    certifications: ['Third-Party Tested'],
  },
  {
    id: 4,
    name: 'Daily Multivitamin',
    category: 'Vitamins',
    price: 14.99,
    description: 'Daily health support with essential micronutrients.',
    image: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=900&q=80',
    ingredients: ['Vitamin A', 'Vitamin D', 'Vitamin C', 'B-Complex', 'Zinc'],
    usage: 'Take 2 capsules with breakfast.',
    faqs: [{ q: 'Is this vegan?', a: 'Yes, capsule shell is plant-based.' }],
    reviews: [{ name: 'Sara', rating: 5, text: 'Easy daily routine support.' }],
    goals: ['recovery', 'fat-loss'],
    inStock: false,
    featured: false,
    certifications: ['GMP Certified'],
  },
  {
    id: 5,
    name: 'Steel Shaker Bottle',
    category: 'Accessories',
    price: 12.99,
    description: 'Durable leakproof shaker for gym use.',
    image: 'https://images.unsplash.com/photo-1517964603305-11c0f6f66012?auto=format&fit=crop&w=900&q=80',
    ingredients: [],
    usage: 'Use for shakes and hydration.',
    faqs: [{ q: 'Dishwasher safe?', a: 'Yes, top-rack safe.' }],
    reviews: [{ name: 'Omar', rating: 4, text: 'Solid and easy to clean.' }],
    goals: ['recovery'],
    inStock: true,
    featured: false,
    certifications: ['BPA Free'],
  },
];

async function seed() {
  await pool.query('TRUNCATE TABLE order_items, orders, addresses, refresh_tokens, users, products RESTART IDENTITY CASCADE;');

  for (const product of products) {
    await pool.query(
      `
      INSERT INTO products (id, name, category, price, description, image, ingredients, usage, faqs, reviews, goals, in_stock, featured, certifications)
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9::jsonb, $10::jsonb, $11::jsonb, $12, $13, $14::jsonb)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        category = EXCLUDED.category,
        price = EXCLUDED.price,
        description = EXCLUDED.description,
        image = EXCLUDED.image,
        ingredients = EXCLUDED.ingredients,
        usage = EXCLUDED.usage,
        faqs = EXCLUDED.faqs,
        reviews = EXCLUDED.reviews,
        goals = EXCLUDED.goals,
        in_stock = EXCLUDED.in_stock,
        featured = EXCLUDED.featured,
        certifications = EXCLUDED.certifications;
      `,
      [
        product.id,
        product.name,
        product.category,
        product.price,
        product.description,
        product.image,
        JSON.stringify(product.ingredients),
        product.usage,
        JSON.stringify(product.faqs),
        JSON.stringify(product.reviews),
        JSON.stringify(product.goals),
        product.inStock,
        product.featured,
        JSON.stringify(product.certifications),
      ]
    );
  }

  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  await pool.query(
    'INSERT INTO users (name, email, password_hash, is_admin) VALUES ($1, $2, $3, true)',
    ['Fusion Admin', 'admin@fusion.store', adminPasswordHash]
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
