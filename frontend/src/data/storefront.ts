import type { Product } from '../types';

export const fallbackProducts: Product[] = [
  {
    id: 201,
    name: 'Hydra Surge',
    category: 'Hydration',
    price: 34,
    description: 'Daily electrolyte drink to support endurance, pump, and recovery.',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 202,
    name: 'Ignite Pre',
    category: 'Pre-Workout',
    price: 39,
    description: 'Fully dosed pre-workout with clean energy, focus, and no crash.',
    image: 'https://images.unsplash.com/photo-1608500218808-3b01d4d88f2c?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 203,
    name: 'Pure Isolate',
    category: 'Protein',
    price: 74,
    description: 'Fast-digesting whey isolate for lean muscle and performance nutrition.',
    image: 'https://images.unsplash.com/photo-1579722821273-0f6c0a6f8f3a?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 204,
    name: 'Creatine HCL+',
    category: 'Creatine',
    price: 24,
    description: 'Highly bioavailable creatine to drive power, output, and strength.',
    image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 205,
    name: 'Amino Flow',
    category: 'Amino Acids',
    price: 32,
    description: 'EAA hydration blend built for intense sessions and longer training blocks.',
    image: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 206,
    name: 'Daily Greens',
    category: 'Wellness',
    price: 42,
    description: 'Greens and digestive support to keep nutrition consistent year-round.',
    image: 'https://images.unsplash.com/photo-1612538498456-e861df91d4d0?auto=format&fit=crop&w=900&q=80',
  },
];

export const stackCards = [
  {
    title: 'Elite Performance Stack',
    body: 'Three proven formulas for training intensity, strength output, and faster recovery.',
  },
  {
    title: 'Daily Wellness Stack',
    body: 'Core micronutrients, hydration, and gut support for long-term consistency.',
  },
  {
    title: 'Lean Physique Stack',
    body: 'High-protein and low-sugar support for body composition and energy balance.',
  },
];
