export type Product = {
  id: number;
  name: string;
  brand?: string;
  category: string;
  flavor?: string;
  servings?: number;
  price: number;
  description: string;
  image: string;
  images?: string[];
  ingredients?: string[];
  usage?: string;
  faqs?: Array<{ q: string; a: string }>;
  reviews?: Array<{ name: string; rating: number; text: string; verifiedPurchase?: boolean; createdAt?: string }>;
  goals?: string[];
  inStock?: boolean;
  stockQuantity?: number;
  lowStockThreshold?: number;
  featured?: boolean;
  supplementFacts?: {
    servingSize?: string;
    servingsPerContainer?: number;
    highlights?: string[];
    [key: string]: unknown;
  };
  certifications?: string[];
};

export type CartItem = Product & {
  quantity: number;
};

export type CheckoutPayload = {
  items: Array<{ id: number; quantity: number }>;
  promoCode?: string;
  bundleCode?: string;
  shippingMethod?: 'standard' | 'express';
  subscribeFrequency?: string;
  shipping?: {
    fullName: string;
    email: string;
    address: string;
    city: string;
    zip: string;
  };
};

export type CheckoutResponse = {
  ok: boolean;
  orderId: string;
  submittedAt: string;
  subtotal?: number;
  shipping?: number;
  tax?: number;
  discount?: number;
  total: number;
  itemCount: number;
  emailSent?: boolean;
};

export type User = {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
  emailVerified?: boolean;
  welcomeCoupon?: string;
  welcomePerkClaimedAt?: string | null;
  goal?: string;
  dietType?: string;
  trainingFrequency?: string;
  preferredShippingAddress?: string;
  preferredCurrency?: string;
  defaultShippingMethod?: string;
  defaultSubscribeFrequency?: string;
};

export type Address = {
  id: number;
  fullName: string;
  email: string;
  address: string;
  city: string;
  zip: string;
  isDefault: boolean;
};

export type PaymentMethod = {
  id: number;
  cardBrand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
};

export type Coupon = {
  id: number;
  code: string;
  description: string;
  discountPercent: number;
  minSubtotal: number;
  active: boolean;
  expiresAt?: string | null;
  createdAt?: string;
};
