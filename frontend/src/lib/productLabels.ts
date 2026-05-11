import type { Product } from '../types';

export function getProductTypeLabel(product: Product): string {
  const name = product.name.toLowerCase();
  const category = product.category.toLowerCase();

  if (category === 'protein') {
    if (name.includes('whey')) return 'Whey Protein';
    if (name.includes('casein')) return 'Casein Protein';
    if (name.includes('vegan') || name.includes('plant')) return 'Plant Protein';
    return 'Protein Powder';
  }

  if (category === 'creatine') return 'Creatine Monohydrate';
  if (category === 'pre-workout') return 'Pre-Workout Formula';
  if (category === 'vitamins') {
    if (name.includes('omega')) return 'Omega-3 Supplement';
    if (name.includes('multivitamin')) return 'Multivitamin';
    return 'Vitamin Supplement';
  }
  if (category === 'hydration') return 'Electrolyte Hydration';
  if (category === 'weight gainer') return 'Mass Gainer';
  if (category === 'recovery') return 'Recovery Supplement';

  return product.category;
}
