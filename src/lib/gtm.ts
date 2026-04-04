/* ── Google Tag Manager dataLayer helpers ──────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function push(data: Record<string, any>) {
  if (typeof window === 'undefined') return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ ecommerce: null }); // clear previous ecommerce data
  w.dataLayer.push(data);
}

interface GTMItem {
  item_id: number;
  item_name: string;
  price: number;
  quantity?: number;
  item_brand?: string;
  item_category?: string;
}

export function gtmViewItem(item: GTMItem) {
  push({
    event: 'view_item',
    ecommerce: {
      currency: 'EUR',
      value: item.price,
      items: [{ ...item, quantity: 1 }],
    },
  });
}

export function gtmAddToCart(item: GTMItem) {
  push({
    event: 'add_to_cart',
    ecommerce: {
      currency: 'EUR',
      value: item.price * (item.quantity || 1),
      items: [{ ...item, quantity: item.quantity || 1 }],
    },
  });
}

export function gtmBeginCheckout(items: GTMItem[], value: number) {
  push({
    event: 'begin_checkout',
    ecommerce: {
      currency: 'EUR',
      value,
      items,
    },
  });
}

export function gtmPurchase(
  transactionId: string,
  value: number,
  items: GTMItem[],
  shipping?: number,
  coupon?: string,
) {
  push({
    event: 'purchase',
    ecommerce: {
      transaction_id: transactionId,
      currency: 'EUR',
      value,
      shipping: shipping || 0,
      coupon: coupon || '',
      items,
    },
  });
}
