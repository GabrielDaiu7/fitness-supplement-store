import type { CartItem, CheckoutPayload, CheckoutResponse, Product, User } from '../types';

const API = import.meta.env.VITE_API_URL ?? '/api';
let accessToken = '';

function authHeaders(): HeadersInit {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

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

export async function searchProducts(params: {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  goal?: string;
  inStock?: boolean;
  category?: string;
}): Promise<Product[]> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.minPrice !== undefined) qs.set('minPrice', String(params.minPrice));
  if (params.maxPrice !== undefined) qs.set('maxPrice', String(params.maxPrice));
  if (params.goal) qs.set('goal', params.goal);
  if (params.inStock) qs.set('inStock', 'true');
  if (params.category) qs.set('category', params.category);
  const response = await fetch(`${API}/products?${qs.toString()}`);
  if (!response.ok) throw new Error('Failed to search products');
  const data = (await response.json()) as Product[];
  return data.map(normalizeProduct);
}

export async function fetchProductById(id: number): Promise<Product & { relatedProducts: Product[] }> {
  const response = await fetch(`${API}/products/${id}`);
  if (!response.ok) throw new Error('Failed to load product details');
  const data = (await response.json()) as Product & { relatedProducts: Product[] };
  return {
    ...normalizeProduct(data),
    relatedProducts: data.relatedProducts.map(normalizeProduct),
  };
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
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Checkout failed');
  }

  return (await response.json()) as CheckoutResponse;
}

export async function submitAdvancedCheckout(payload: CheckoutPayload): Promise<CheckoutResponse> {
  const response = await fetch(`${API}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Checkout failed');
  return (await response.json()) as CheckoutResponse;
}

export async function register(name: string, email: string, password: string): Promise<User> {
  const response = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name, email, password }),
  });
  if (!response.ok) throw new Error('Registration failed');
  const data = (await response.json()) as { accessToken: string; user: User };
  accessToken = data.accessToken;
  return data.user;
}

export async function login(email: string, password: string): Promise<User> {
  const response = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error('Login failed');
  const data = (await response.json()) as { accessToken: string; user: User };
  accessToken = data.accessToken;
  return data.user;
}

export async function refreshSession(): Promise<boolean> {
  const response = await fetch(`${API}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok) return false;
  const data = (await response.json()) as { accessToken?: string };
  if (!data.accessToken) return false;
  accessToken = data.accessToken;
  return true;
}

export async function getMe(): Promise<User | null> {
  if (!accessToken) {
    const ok = await refreshSession();
    if (!ok) return null;
  }
  const response = await fetch(`${API}/auth/me`, {
    headers: { ...authHeaders() },
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { user: User };
  return data.user;
}

export async function logout(): Promise<void> {
  await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' });
  accessToken = '';
}

export async function fetchOrders(): Promise<
  Array<{ orderCode: string; total: number; status: string; createdAt: string; subscriptionFrequency?: string }>
> {
  const response = await fetch(`${API}/account/orders`, { headers: { ...authHeaders() } });
  if (!response.ok) throw new Error('Failed to load orders');
  const data = (await response.json()) as {
    orders: Array<{ orderCode: string; total: number; status: string; createdAt: string; subscriptionFrequency?: string }>;
  };
  return data.orders;
}

export async function fetchAdminProducts(): Promise<Array<{ id: number; name: string; category: string; price: number; inStock: boolean; featured: boolean }>> {
  const response = await fetch(`${API}/admin/products`, { headers: { ...authHeaders() } });
  if (!response.ok) throw new Error('Failed to load admin products');
  const data = (await response.json()) as {
    products: Array<{ id: number; name: string; category: string; price: number; inStock: boolean; featured: boolean }>;
  };
  return data.products.map((product) => ({
    ...product,
    price: Number(product.price),
  }));
}

export async function updateAdminProduct(
  id: number,
  payload: { price?: number; inStock?: boolean; featured?: boolean }
): Promise<void> {
  const response = await fetch(`${API}/admin/products/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to update product');
}
