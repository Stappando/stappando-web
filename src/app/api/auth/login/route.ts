import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';
import { isNonEmptyString, sanitize } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ message: 'Body JSON non valido' }, { status: 400 });
    }

    const username = sanitize(body.username, 254);
    const password = sanitize(body.password, 128);

    if (!isNonEmptyString(username) || !isNonEmptyString(password)) {
      return NextResponse.json({ message: 'Username e password obbligatori' }, { status: 400 });
    }

    const wc = getWCSecrets();

    // 1. Get JWT token
    const tokenRes = await fetch(`${wc.baseUrl}/wp-json/jwt-auth/v1/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      return NextResponse.json(
        { message: tokenData.message || 'Credenziali non valide' },
        { status: 401 },
      );
    }

    const email = tokenData.data?.email || tokenData.user_email || username;
    const userId = tokenData.data?.id || tokenData.user_id || 0;
    const nicename = tokenData.data?.nicename || tokenData.user_nicename || username;
    const token = tokenData.data?.token || tokenData.token;
    const firstName = tokenData.data?.firstName || '';
    const lastName = tokenData.data?.lastName || '';

    // 2. Fetch customer data — try WC first, then direct customer by ID
    let custFirstName = firstName;
    let custLastName = lastName;
    let custId = userId;
    let custRole = 'customer';
    let vendorStatus: string | null = null;
    try {
      // Try by email first
      let customer = null;
      const custUrl = `${wc.baseUrl}/wp-json/wc/v3/customers?email=${encodeURIComponent(email)}&consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}&role=all`;
      const custRes = await fetch(custUrl);
      if (custRes.ok) {
        const customers = await custRes.json();
        if (customers[0]) customer = customers[0];
      }
      // If not found by email (vendor role not in WC customers), try by ID
      if (!customer && custId) {
        const byIdUrl = `${wc.baseUrl}/wp-json/wc/v3/customers/${custId}?consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;
        const byIdRes = await fetch(byIdUrl);
        if (byIdRes.ok) customer = await byIdRes.json();
      }
      if (customer) {
        custFirstName = customer.first_name || custFirstName;
        custLastName = customer.last_name || custLastName;
        custId = customer.id || custId;
        const isVendorMeta = customer.meta_data?.some((m: { key: string; value: string }) => m.key === '_is_vendor' && m.value === 'true');
        const isWPVendorRole = ['wcfm_vendor', 'dc_vendor', 'seller'].includes(customer.role);
        custRole = isVendorMeta || isWPVendorRole || customer.role === 'vendor' ? 'vendor' : (customer.role || 'customer');
        const vendorStatusMeta = customer.meta_data?.find((m: { key: string; value: string }) => m.key === '_vendor_status');
        if (vendorStatusMeta) vendorStatus = vendorStatusMeta.value;
        // WP vendor role assigned by admin = approved regardless of meta
        if (isWPVendorRole && vendorStatus !== 'approved') vendorStatus = 'approved';
      }
    } catch { /* use JWT data */ }

    return NextResponse.json({
      user: {
        id: custId,
        email,
        firstName: custFirstName,
        lastName: custLastName,
        username: nicename,
      },
      token,
      role: custRole,
      vendorStatus,
    });
  } catch {
    return NextResponse.json({ message: 'Errore del server' }, { status: 500 });
  }
}
