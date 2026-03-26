/** Vendor authentication helpers — server-side only */
import { getWCSecrets } from '@/lib/config';

export interface VendorProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  cantina: string;
  regione: string;
  piva: string;
  telefono: string;
  sito: string;
  role: string;
}

/** Check if a WC customer has vendor role */
export async function isVendor(userId: number): Promise<boolean> {
  const wc = getWCSecrets();
  const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;
  try {
    const res = await fetch(`${wc.baseUrl}/wp-json/wc/v3/customers/${userId}?${auth}`);
    if (!res.ok) return false;
    const customer = await res.json();
    return customer.role === 'vendor' || customer.role === 'wcfm_vendor' || customer.role === 'dc_vendor';
  } catch {
    return false;
  }
}

/** Get vendor profile from WC customer meta */
export async function getVendorProfile(userId: number): Promise<VendorProfile | null> {
  const wc = getWCSecrets();
  const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;
  try {
    const res = await fetch(`${wc.baseUrl}/wp-json/wc/v3/customers/${userId}?${auth}`);
    if (!res.ok) return null;
    const c = await res.json();
    const meta = (c.meta_data || []) as { key: string; value: string }[];
    const get = (k: string) => meta.find(m => m.key === k)?.value || '';

    return {
      id: c.id,
      email: c.email,
      firstName: c.first_name,
      lastName: c.last_name,
      cantina: get('_vendor_cantina') || `${c.first_name} ${c.last_name}`,
      regione: get('_vendor_regione'),
      piva: get('_vendor_piva'),
      telefono: get('_vendor_telefono') || c.billing?.phone || '',
      sito: get('_vendor_sito'),
      role: c.role,
    };
  } catch {
    return null;
  }
}
