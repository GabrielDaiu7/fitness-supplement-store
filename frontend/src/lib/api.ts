import type { CartItem, CheckoutPayload, CheckoutResponse, Product } from '../types';

const API = import.meta.env.VITE_API_URL ?? '/api';

function normalizeProduct(product: Product): Product {
  return {
    ...product,
    price: Number(product.price),
  };
}

export async function fetchProducts(): Promise<Product[]> {
  const response = await fetch(`${API}/products`);
  if (!response.ok) {
    throw new Error('Failed to load products');
  }
  const data = (await response.json()) as Product[];
  return data.map(normalizeProduct);
}

export async function fetchCategories(): Promise<string[]> {
  const response = await fetch(`${API}/categories`);
  if (!response.ok) {
    throw new Error('Failed to load categories');
  }
  const data = (await response.json()) as { categories: string[] };
  return data.categories;
}

export async function submitCheckout(cartItems: CartItem[]): Promise<CheckoutResponse> {
  const payload: CheckoutPayload = {
    items: cartItems.map((item) => ({ id: item.id, quantity: item.quantity })),
  };

  const response = await fetch(`${API}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Checkout failed');
  }

  return (await response.json()) as CheckoutResponse;
}
