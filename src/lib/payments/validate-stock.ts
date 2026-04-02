/**
 * Server-side stock validation — called before creating Stripe intent or PayPal order.
 * Fails open (returns ok) if WC API is unreachable, to avoid blocking legitimate orders.
 */
import { getWCSecrets } from '@/lib/config';

interface StockCheckItem {
  id: number;
  name: string;
  quantity: number;
}

interface StockCheckResult {
  ok: boolean;
  error?: string; // user-facing message if stock insufficient
}

export async function validateStock(items: StockCheckItem[]): Promise<StockCheckResult> {
  try {
    const wc = getWCSecrets();
    const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

    // Fetch all products in parallel for speed
    const products = await Promise.all(
      items.map((item) =>
        fetch(
          `${wc.baseUrl}/wp-json/wc/v3/products/${item.id}?${auth}&_fields=id,name,manage_stock,stock_quantity,stock_status`,
        )
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ),
    );

    for (let i = 0; i < items.length; i++) {
      const product = products[i];
      const item = items[i];
      if (!product) continue; // can't fetch → fail open for this item

      const displayName = product.name || item.name || `Prodotto #${item.id}`;

      if (product.stock_status === 'outofstock') {
        return {
          ok: false,
          error: `"${displayName}" non è più disponibile. Rimuovilo dal carrello e riprova.`,
        };
      }

      if (
        product.manage_stock === true &&
        product.stock_quantity !== null &&
        product.stock_quantity !== undefined
      ) {
        const available: number = product.stock_quantity;
        if (available < item.quantity) {
          const plural = available === 1 ? 'bottiglia disponibile' : 'bottiglie disponibili';
          return {
            ok: false,
            error: `"${displayName}": solo ${available} ${plural}, ne hai ${item.quantity} nel carrello.`,
          };
        }
      }
    }

    return { ok: true };
  } catch (err) {
    console.error('[validateStock] Error — failing open:', err);
    return { ok: true }; // fail open: don't block payment if check crashes
  }
}
