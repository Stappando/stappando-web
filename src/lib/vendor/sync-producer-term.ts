/**
 * Sync vendor shop data to the pa_produttore WC attribute term.
 * Single function used by vendor shop PUT and admin vendor shop PUT.
 *
 * Updates:
 *  - term.image.src  → logo  (WC native — readable without any custom endpoint)
 *  - term.description → descrizione (WC native)
 *  - term meta (banner, regione, indirizzo) via stp-app/v1/update-producer-meta
 */
import { getWCSecrets } from '@/lib/config';

interface ShopData {
  logo: string;
  banner: string;
  descrizione: string;
  regione: string;
  indirizzo: string;
}

interface SyncOptions {
  vendorId: number;
  shopData: ShopData;
  /** If already known, pass it directly to skip an extra fetch */
  termId?: number;
}

/**
 * Find the pa_produttore attribute ID (ID 10 is common but not guaranteed).
 * Searches all attributes for slug === 'pa_produttore'.
 */
async function findPaProduttoreAttrId(baseUrl: string, auth: string): Promise<number | null> {
  try {
    const res = await fetch(`${baseUrl}/wp-json/wc/v3/products/attributes?${auth}`);
    if (!res.ok) return null;
    const attrs: { id: number; slug: string }[] = await res.json();
    return attrs.find(a => a.slug === 'pa_produttore')?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Find the term ID for this vendor.
 * Priority: billing.address_2._producer_term_id → search by _vendor_cantina / first_name
 */
async function resolveTermId(
  baseUrl: string,
  auth: string,
  vendorId: number,
  attrId: number,
): Promise<number | null> {
  try {
    // 1. Read from billing.address_2 JSON (set when vendor saves profile)
    const custRes = await fetch(`${baseUrl}/wp-json/wc/v3/customers/${vendorId}?${auth}`);
    if (!custRes.ok) return null;
    const cust = await custRes.json();

    const addr2 = cust.billing?.address_2 || '';
    if (addr2.startsWith('{')) {
      try {
        const extra = JSON.parse(addr2) as Record<string, string>;
        if (extra._producer_term_id) return parseInt(extra._producer_term_id);
      } catch { /* continue */ }
    }

    // 2. Fallback: find term by cantina name
    // Cantina name is in _vendor_cantina meta or first_name
    const meta: { key: string; value: string }[] = cust.meta_data || [];
    const cantinaName = meta.find(m => m.key === '_vendor_cantina')?.value || cust.first_name || '';
    if (!cantinaName) return null;

    console.log(`[SyncTerm] _producer_term_id missing for vendor ${vendorId}, searching by cantina "${cantinaName}"`);

    const termsRes = await fetch(
      `${baseUrl}/wp-json/wc/v3/products/attributes/${attrId}/terms?search=${encodeURIComponent(cantinaName)}&per_page=5&${auth}`,
    );
    if (!termsRes.ok) return null;
    const terms: { id: number; name: string }[] = await termsRes.json();
    const match = terms.find(t => t.name.toLowerCase() === cantinaName.toLowerCase());
    if (!match) return null;

    // Save it back so next time we find it fast
    const newExtra: Record<string, string> = {};
    if (addr2.startsWith('{')) {
      try { Object.assign(newExtra, JSON.parse(addr2)); } catch { /* */ }
    }
    newExtra._producer_term_id = String(match.id);
    await fetch(`${baseUrl}/wp-json/wc/v3/customers/${vendorId}?${auth}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ billing: { address_2: JSON.stringify(newExtra) } }),
    }).catch(() => { /* non-fatal */ });

    console.log(`[SyncTerm] Found term ${match.id} for "${cantinaName}", saved to billing.address_2`);
    return match.id;
  } catch {
    return null;
  }
}

/**
 * Sync shop data → pa_produttore term.
 * Called after saving shipping.company on the vendor customer.
 */
export async function syncShopToProducerTerm(opts: SyncOptions): Promise<void> {
  const { vendorId, shopData } = opts;
  const wc = getWCSecrets();
  const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

  try {
    // Find attribute ID
    const attrId = await findPaProduttoreAttrId(wc.baseUrl, auth);
    if (!attrId) {
      console.error('[SyncTerm] pa_produttore attribute not found');
      return;
    }

    // Find term ID
    const termId = opts.termId ?? await resolveTermId(wc.baseUrl, auth, vendorId, attrId);
    if (!termId) {
      console.warn(`[SyncTerm] No pa_produttore term found for vendor ${vendorId} — save profile first`);
      return;
    }

    // Update WC term: image (logo) + description — these are WC native fields,
    // readable by cantine pages without any custom endpoint
    const termPayload: Record<string, unknown> = {
      description: shopData.descrizione,
    };
    if (shopData.logo) {
      termPayload.image = { src: shopData.logo };
    }

    const termRes = await fetch(
      `${wc.baseUrl}/wp-json/wc/v3/products/attributes/${attrId}/terms/${termId}?${auth}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(termPayload),
      },
    );
    if (!termRes.ok) {
      const e = await termRes.text().catch(() => '');
      console.error(`[SyncTerm] Term update failed (${termRes.status}):`, e);
    } else {
      console.log(`[SyncTerm] Updated term ${termId} for vendor ${vendorId} (logo=${!!shopData.logo})`);
    }

    // Update custom term meta: banner, regione, indirizzo
    // (producer-logos endpoint reads these for /cantine pages)
    const wpUser = process.env.WP_USER;
    const wpPass = process.env.WP_APP_PASSWORD;
    if (wpUser && wpPass) {
      const wpAuth = Buffer.from(`${wpUser}:${wpPass}`).toString('base64');
      const metaRes = await fetch(`${wc.baseUrl}/wp-json/stp-app/v1/update-producer-meta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Basic ${wpAuth}` },
        body: JSON.stringify({
          term_id: termId,
          logo: shopData.logo,
          banner: shopData.banner,
          region: shopData.regione,
          address: shopData.indirizzo,
        }),
      });
      if (!metaRes.ok) {
        const e = await metaRes.text().catch(() => '');
        console.error(`[SyncTerm] update-producer-meta failed (${metaRes.status}):`, e);
      } else {
        console.log(`[SyncTerm] Producer meta synced for term ${termId}`);
      }
    } else {
      console.warn('[SyncTerm] WP_USER/WP_APP_PASSWORD not set — banner/region not synced to term meta');
    }
  } catch (e) {
    console.error('[SyncTerm] Unexpected error:', e);
  }
}
