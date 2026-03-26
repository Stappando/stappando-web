/** Shared payment types used across all providers */

export interface OrderCustomer {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address: string;
  city: string;
  province: string;
  zip: string;
  notes?: string;
  needsInvoice?: boolean;
  ragioneSociale?: string;
  piva?: string;
  codFiscale?: string;
  sdi?: string;
}

export interface OrderLineItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderPayload {
  items: OrderLineItem[];
  shipping: number;
  customer: OrderCustomer;
  couponCode?: string;
  couponDiscount?: number;
}

export type PaymentProvider = 'stripe' | 'paypal' | 'cod';
