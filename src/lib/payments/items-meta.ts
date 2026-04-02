/**
 * Helpers to store and restore cart items in Stripe PaymentIntent metadata.
 *
 * Stripe limits each metadata value to 500 chars.
 * We use compact format { i:id, q:qty, p:price } and chunk across
 * multiple keys (items_json, items_json_1, items_json_2 …) so large
 * carts never get truncated.
 */

export interface CompactItem {
  i: number;  // product id
  q: number;  // quantity
  p: number;  // unit price
}

export interface ResolvedItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

const CHUNK_LIMIT = 490; // safe margin under Stripe's 500-char per-value limit

/** Build Stripe metadata keys for items, chunked to stay ≤490 chars each. */
export function buildItemsMetadata(
  items: { id: number; quantity: number; price: number }[],
): Record<string, string> {
  const compact: CompactItem[] = items.map(i => ({ i: i.id, q: i.quantity, p: i.price }));
  const result: Record<string, string> = {};
  let chunk: CompactItem[] = [];
  let chunkIdx = 0;

  const flush = () => {
    if (chunk.length === 0) return;
    const key = chunkIdx === 0 ? 'items_json' : `items_json_${chunkIdx}`;
    result[key] = JSON.stringify(chunk);
    chunk = [];
    chunkIdx++;
  };

  for (const item of compact) {
    const testChunk = [...chunk, item];
    if (JSON.stringify(testChunk).length > CHUNK_LIMIT && chunk.length > 0) {
      flush();
    }
    chunk.push(item);
  }
  flush();

  return result;
}

/** Parse items back from Stripe metadata.
 *  Handles:
 *    1. New chunked compact format (items_json + items_json_1 …)
 *    2. Old single-key format with name field: { id, qty, price, name? }
 *    3. Truncated / invalid JSON — falls back to regex extraction of complete objects
 */
export function parseItemsFromMeta(
  meta: Record<string, string>,
): ResolvedItem[] {
  // Collect all chunk values
  const chunks: string[] = [];
  for (let idx = 0; ; idx++) {
    const key = idx === 0 ? 'items_json' : `items_json_${idx}`;
    if (!meta[key]) break;
    chunks.push(meta[key]);
  }

  if (chunks.length === 0) return [];

  const allItems: ResolvedItem[] = [];

  for (const chunk of chunks) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(chunk);
    } catch {
      // Fallback: extract complete item objects via regex (handles truncated JSON)
      parsed = extractCompleteItems(chunk);
    }

    if (!Array.isArray(parsed)) continue;

    for (const item of parsed) {
      if (typeof item !== 'object' || item === null) continue;
      const obj = item as Record<string, unknown>;

      // Support both compact { i, q, p } and legacy { id, qty, price, name }
      const id     = Number(obj.i  ?? obj.id  ?? 0);
      const qty    = Number(obj.q  ?? obj.qty  ?? 1);
      const price  = Number(obj.p  ?? obj.price ?? 0);
      const name   = String(obj.name ?? '');

      if (id > 0) {
        allItems.push({ id, quantity: qty, price, name });
      }
    }
  }

  return allItems;
}

/** Regex-based extraction of complete item objects from a potentially truncated JSON array.
 *  Matches both compact { "i":…, "q":…, "p":… } and legacy { "id":…, "qty":…, "price":… }.
 */
function extractCompleteItems(raw: string): ResolvedItem[] {
  const items: ResolvedItem[] = [];

  // Compact format: {"i":66780,"q":1,"p":8.9}
  const compactRe = /\{"i":(\d+),"q":(\d+),"p":([\d.]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = compactRe.exec(raw)) !== null) {
    items.push({ id: +m[1], quantity: +m[2], price: +m[3], name: '' });
  }
  if (items.length > 0) return items;

  // Legacy format: {"id":66780,"qty":1,"price":8.9,"name":"..."}
  const legacyRe = /\{"id":(\d+),"qty":(\d+),"price":([\d.]+)(?:,"name":"[^"]*")?\}/g;
  while ((m = legacyRe.exec(raw)) !== null) {
    items.push({ id: +m[1], quantity: +m[2], price: +m[3], name: '' });
  }
  return items;
}
