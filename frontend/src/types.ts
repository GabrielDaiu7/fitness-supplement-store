export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  ingredients?: string[];
  usage?: string;
  faqs?: Array<{ q: string; a: string }>;
  reviews?: Array<{ name: string; rating: number; text: string }>;
  goals?: string[];
  inStock?: boolean;
  featured?: boolean;
  certifications?: string[];
};

export type CartItem = Product & {
  quantity: number;
};

export type CheckoutPayload = {
  items: Array<{ id: number; quantity: number }>;
  promoCode?: string;
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
};
