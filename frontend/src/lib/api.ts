import type { Address, CartItem, CheckoutPayload, CheckoutResponse, PaymentMethod, Product, User } from '../types';

const API = import.meta.env.VITE_API_URL ?? '/api';
let accessToken = '';

function authHeaders(): HeadersInit {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

async function ensureAuth(): Promise<void> {
  if (accessToken) return;
  const ok = await refreshSession();
  if (!ok) {
    throw new Error('Unauthorized');
  }
}

function normalizeProduct(product: Product): Product {
  const normalizedImages = Array.isArray(product.images) && product.images.length > 0 ? product.images : [product.image];
  return {
    ...product,
    price: Number(product.price),
    images: normalizedImages,
    image: normalizedImages[0],
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

export async function register(
  name: string,
  email: string,
  password: string
): Promise<{ user: User; verificationToken?: string; welcomeCoupon?: string; freeShippingOver?: number }> {
  const response = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name, email, password }),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message || 'Registration failed');
  }
  const data = (await response.json()) as {
    accessToken: string;
    user: User;
    verification?: { token?: string };
    welcome?: { couponCode?: string; freeShippingOver?: number };
  };
  accessToken = data.accessToken;
  return {
    user: data.user,
    verificationToken: data.verification?.token,
    welcomeCoupon: data.welcome?.couponCode,
    freeShippingOver: data.welcome?.freeShippingOver,
  };
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

export async function verifyEmail(token: string): Promise<boolean> {
  const response = await fetch(`${API}/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  return response.ok;
}

export async function resendVerification(email: string): Promise<{ ok: boolean; verificationToken?: string }> {
  const response = await fetch(`${API}/auth/resend-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) return { ok: false };
  const data = (await response.json()) as { verificationToken?: string };
  return { ok: true, verificationToken: data.verificationToken };
}

export async function updateOnboardingProfile(payload: {
  goal?: string;
  dietType?: string;
  trainingFrequency?: string;
  preferredShippingAddress?: string;
  preferredCurrency?: string;
  defaultShippingMethod?: string;
  defaultSubscribeFrequency?: string;
}): Promise<boolean> {
  await ensureAuth();
  const response = await fetch(`${API}/auth/onboarding`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return response.ok;
}

export async function trackAuthEvent(eventName: string, email?: string, metadata?: Record<string, unknown>): Promise<void> {
  await fetch(`${API}/auth/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ eventName, email, metadata }),
  });
}

export async function submitDataRequest(requestType: 'export' | 'delete'): Promise<void> {
  await ensureAuth();
  const response = await fetch(`${API}/auth/data-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ requestType }),
  });
  if (!response.ok) throw new Error('Failed to submit data request');
}

export async function sendWelcomePerkEmail(): Promise<{ alreadyClaimed: boolean }> {
  await ensureAuth();
  const response = await fetch(`${API}/auth/welcome-perk`, {
    method: 'POST',
    headers: { ...authHeaders() },
  });
  if (!response.ok) throw new Error('Failed to send welcome perks email');
  const data = (await response.json()) as { alreadyClaimed?: boolean };
  return { alreadyClaimed: Boolean(data.alreadyClaimed) };
}

export async function logout(): Promise<void> {
  await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' });
  accessToken = '';
}

export async function fetchOrders(): Promise<
  Array<{ orderCode: string; total: number; status: string; createdAt: string; subscriptionFrequency?: string }>
> {
  await ensureAuth();
  const response = await fetch(`${API}/account/orders`, { headers: { ...authHeaders() } });
  if (!response.ok) throw new Error('Failed to load orders');
  const data = (await response.json()) as {
    orders: Array<{ orderCode: string; total: number; status: string; createdAt: string; subscriptionFrequency?: string }>;
  };
  return data.orders;
}

export async function fetchOrderDetails(orderCode: string): Promise<{
  orderCode: string;
  total: number;
  status: string;
  createdAt: string;
  items: Array<{ productId: number; name: string; quantity: number; unitPrice: number }>;
}> {
  await ensureAuth();
  const response = await fetch(`${API}/account/orders/${orderCode}`, { headers: { ...authHeaders() } });
  if (!response.ok) throw new Error('Failed to load order details');
  const data = (await response.json()) as {
    order: {
      orderCode: string;
      total: number;
      status: string;
      createdAt: string;
      items: Array<{ productId: number; name: string; quantity: number; unitPrice: number }>;
    };
  };
  return data.order;
}

export async function reorderOrder(orderCode: string): Promise<Array<{ id: number; quantity: number }>> {
  await ensureAuth();
  const response = await fetch(`${API}/account/orders/${orderCode}/reorder`, {
    method: 'POST',
    headers: { ...authHeaders() },
  });
  if (!response.ok) throw new Error('Failed to reorder');
  const data = (await response.json()) as { items: Array<{ id: number; quantity: number }> };
  return data.items;
}

export async function fetchAddresses(): Promise<Address[]> {
  await ensureAuth();
  const response = await fetch(`${API}/account/addresses`, { headers: { ...authHeaders() } });
  if (!response.ok) throw new Error('Failed to load addresses');
  const data = (await response.json()) as { addresses: Address[] };
  return data.addresses;
}

export async function createAddress(payload: Omit<Address, 'id'>): Promise<Address> {
  await ensureAuth();
  const response = await fetch(`${API}/account/addresses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to save address');
  const data = (await response.json()) as { address: Address };
  return data.address;
}

export async function fetchPaymentMethods(): Promise<PaymentMethod[]> {
  await ensureAuth();
  const response = await fetch(`${API}/account/payment-methods`, { headers: { ...authHeaders() } });
  if (!response.ok) throw new Error('Failed to load payment methods');
  const data = (await response.json()) as { paymentMethods: PaymentMethod[] };
  return data.paymentMethods;
}

export async function createPaymentMethod(payload: {
  cardBrand: string;
  cardNumber: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}): Promise<PaymentMethod> {
  await ensureAuth();
  const response = await fetch(`${API}/account/payment-methods`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to save payment method');
  const data = (await response.json()) as { paymentMethod: PaymentMethod };
  return data.paymentMethod;
}

export async function createSupportTicket(payload: {
  orderCode?: string;
  issueType: string;
  message: string;
  returnRequested?: boolean;
}): Promise<void> {
  await ensureAuth();
  const response = await fetch(`${API}/account/support/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to create support ticket');
}

export async function fetchSupportTickets(): Promise<
  Array<{ id: number; issueType: string; message: string; status: string; returnStatus: string; createdAt: string; orderCode?: string }>
> {
  await ensureAuth();
  const response = await fetch(`${API}/account/support/tickets`, { headers: { ...authHeaders() } });
  if (!response.ok) throw new Error('Failed to load support tickets');
  const data = (await response.json()) as {
    tickets: Array<{ id: number; issueType: string; message: string; status: string; returnStatus: string; createdAt: string; orderCode?: string }>;
  };
  return data.tickets;
}

export async function fetchAdminProducts(): Promise<
  Array<{ id: number; name: string; category: string; description?: string; image?: string; price: number; inStock: boolean; featured: boolean }>
> {
  await ensureAuth();
  const response = await fetch(`${API}/admin/products`, { headers: { ...authHeaders() } });
  if (!response.ok) throw new Error('Failed to load admin products');
  const data = (await response.json()) as {
    products: Array<{ id: number; name: string; category: string; description?: string; image?: string; price: number; inStock: boolean; featured: boolean }>;
  };
  return data.products.map((product) => ({
    ...product,
    price: Number(product.price),
  }));
}

export async function updateAdminProduct(
  id: number,
  payload: { name?: string; category?: string; description?: string; image?: string; price?: number; inStock?: boolean; featured?: boolean }
): Promise<void> {
  await ensureAuth();
  const response = await fetch(`${API}/admin/products/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to update product');
}

export async function createAdminProduct(payload: {
  name: string;
  category: string;
  price: number;
  description?: string;
  image?: string;
  inStock?: boolean;
  featured?: boolean;
}): Promise<{ id: number; name: string; category: string; price: number; inStock: boolean; featured: boolean }> {
  await ensureAuth();
  const response = await fetch(`${API}/admin/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to create product');
  const data = (await response.json()) as {
    product: { id: number; name: string; category: string; price: number; inStock: boolean; featured: boolean };
  };
  return { ...data.product, price: Number(data.product.price) };
}

export async function fetchAdminOverview(): Promise<{
  totalSales: number;
  totalOrders: number;
  totalUsers: number;
  activeProducts: number;
  outOfStockProducts: number;
  activeSubscriptions: number;
}> {
  await ensureAuth();
  const response = await fetch(`${API}/admin/overview`, { headers: { ...authHeaders() } });
  if (!response.ok) throw new Error('Failed to load admin overview');
  const data = (await response.json()) as {
    metrics: {
      totalSales: number;
      totalOrders: number;
      totalUsers: number;
      activeProducts: number;
      outOfStockProducts: number;
      activeSubscriptions: number;
    };
  };
  return data.metrics;
}

export async function fetchAdminFunnel(): Promise<{
  registerStarted: number;
  registerCompleted: number;
  verifyCompleted: number;
  firstOrderUsers: number;
  couponOrders: number;
}> {
  await ensureAuth();
  const response = await fetch(`${API}/admin/funnel`, { headers: { ...authHeaders() } });
  if (!response.ok) throw new Error('Failed to load admin funnel');
  const data = (await response.json()) as {
    metrics: {
      registerStarted: number;
      registerCompleted: number;
      verifyCompleted: number;
      firstOrderUsers: number;
      couponOrders: number;
    };
  };
  return data.metrics;
}

export async function fetchAdminOrders(): Promise<
  Array<{
    id: number;
    orderCode: string;
    total: number;
    status: string;
    createdAt: string;
    subscriptionFrequency?: string;
    customerName: string;
    customerEmail: string;
  }>
> {
  await ensureAuth();
  const response = await fetch(`${API}/admin/orders`, { headers: { ...authHeaders() } });
  if (!response.ok) throw new Error('Failed to load admin orders');
  const data = (await response.json()) as {
    orders: Array<{
      id: number;
      orderCode: string;
      total: number;
      status: string;
      createdAt: string;
      subscriptionFrequency?: string;
      customerName: string;
      customerEmail: string;
    }>;
  };
  return data.orders.map((order) => ({ ...order, total: Number(order.total) }));
}

export async function updateAdminOrderStatus(orderId: number, status: string): Promise<void> {
  await ensureAuth();
  const response = await fetch(`${API}/admin/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error('Failed to update order status');
}

export async function fetchAdminUsers(): Promise<
  Array<{ id: number; name: string; email: string; isAdmin: boolean; createdAt: string }>
> {
  await ensureAuth();
  const response = await fetch(`${API}/admin/users`, { headers: { ...authHeaders() } });
  if (!response.ok) throw new Error('Failed to load admin users');
  const data = (await response.json()) as {
    users: Array<{ id: number; name: string; email: string; isAdmin: boolean; createdAt: string }>;
  };
  return data.users;
}
