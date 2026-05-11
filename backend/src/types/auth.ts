export type AuthPayload = {
  id: number;
  email: string;
  isAdmin: boolean;
};

export type AuthedRequest = import('express').Request & {
  user?: AuthPayload;
};

export type CheckoutItem = {
  id: number;
  quantity: number;
};
