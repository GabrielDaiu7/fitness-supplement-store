export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
};

export type CartItem = Product & {
  quantity: number;
};

export type CheckoutPayload = {
  items: Array<{ id: number; quantity: number }>;
};

export type CheckoutResponse = {
  ok: boolean;
  orderId: string;
  submittedAt: string;
  total: number;
  itemCount: number;
};
