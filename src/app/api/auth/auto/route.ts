import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';
import { isValidEmail, sanitize } from '@/lib/validation';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ message: 'Body non valido' }, { status: 400 });

    const email = sanitize(body.email, 254);
    const password = sanitize(body.password, 128);
    const vendorMode = body.vendorMode === true;

    if (!isValidEmail(email)) return NextResponse.json({ message: 'Email non valida' }, { status: 400 });
    if (!password || password.length < 6) return NextResponse.json({ message: 'Password minimo 6 caratteri' }, { status: 400 });

    const wc = getWCSecrets();
    const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

    // ─── STEP 1: Try login ─────────────────────────────
    const tokenRes = await fetch(`${wc.baseUrl}/wp-json/jwt-auth/v1/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, password }),
      signal: AbortSignal.timeout(15000),
    });

    if (tokenRes.ok) {
      const tokenData = await tokenRes.json();
      const token = tokenData.data?.token || tokenData.token;
      if (token) {
        // Check if vendor by fetching customer meta (with short timeout)
        const customer = await fetchCustomer(wc.baseUrl, auth, email);
        const isVendorMeta = customer?.meta_data?.some((m: { key: string; value: string }) => m.key === '_is_vendor' && m.value === 'true');
        const wpRole = customer?.role || 'customer';
        const isWcfmVendor = wpRole === 'wcfm_vendor' || wpRole === 'dc_vendor' || wpRole === 'vendor';
        const isVendor = isVendorMeta || isWcfmVendor;

        // If WP role is wcfm_vendor → automatically approved
        const vendorStatus = isWcfmVendor ? 'approved' : (
          customer?.meta_data?.find((m: { key: string }) => m.key === '_vendor_status')?.value || null
        );

        return NextResponse.json({
          action: 'login',
          user: {
            id: customer?.id || tokenData.data?.id || 0,
            email,
            firstName: customer?.first_name || '',
            lastName: customer?.last_name || '',
            username: tokenData.data?.nicename || email,
          },
          token,
          role: isVendor ? 'vendor' : 'customer',
          isVendor,
          vendorStatus,
        });
      }
    }

    // ─── STEP 2: Register (create customer without meta — faster) ──
    let userId = 0;
    let registered = false;

    try {
      // Create bare customer — no meta (meta added separately after)
      const regRes = await fetch(`${wc.baseUrl}/wp-json/wc/v3/customers?${auth}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(50000),
        body: JSON.stringify({
          email,
          password,
          username: email,
          first_name: '',
          last_name: '',
        }),
      });

      if (regRes.ok) {
        const regData = await regRes.json();
        userId = regData.id;
        registered = true;
      } else {
        const errData = await regRes.json().catch(() => ({}));
        const msg = (errData.message || errData.code || '').toLowerCase();
        if (msg.includes('already') || msg.includes('exist') || msg.includes('già') || msg.includes('registration')) {
          return NextResponse.json({ message: 'Email già registrata. Controlla la password.' }, { status: 401 });
        }
        return NextResponse.json({ message: errData.message || 'Errore registrazione' }, { status: 400 });
      }
    } catch {
      // Timeout — try login in case user was created
      await new Promise(r => setTimeout(r, 2000));
      const retryLogin = await tryLogin(wc.baseUrl, email, password);
      if (retryLogin) {
        // User was created despite timeout — save vendor meta in background
        if (vendorMode) saveVendorMeta(wc.baseUrl, auth, email);
        return NextResponse.json({
          action: 'registered',
          user: { id: 0, email, firstName: '', lastName: '', username: email },
          token: retryLogin,
          role: vendorMode ? 'vendor' : 'customer',
          isVendor: vendorMode,
          vendorStatus: vendorMode ? 'pending_contract' : null,
        });
      }
      return NextResponse.json({ message: 'Il server è lento. Riprova tra qualche secondo.' }, { status: 503 });
    }

    // ─── STEP 2b: Save vendor meta SEPARATELY (much faster than during creation) ──
    if (registered && vendorMode && userId) {
      // Fire and don't wait — PUT is fast on existing users
      saveVendorMeta(wc.baseUrl, auth, email, userId);
    }

    // ─── STEP 3: Auto-login ────────────────────────────
    if (registered) {
      const token = await tryLogin(wc.baseUrl, email, password);
      if (token) {
        return NextResponse.json({
          action: 'registered',
          user: { id: userId, email, firstName: '', lastName: '', username: email },
          token,
          role: vendorMode ? 'vendor' : 'customer',
          isVendor: vendorMode,
          vendorStatus: vendorMode ? 'pending_contract' : null,
        });
      }

      return NextResponse.json({
        action: 'registered_no_login',
        message: 'Account creato! Chiudi e accedi con le tue credenziali.',
        user: { id: userId, email, firstName: '', lastName: '', username: email },
        role: vendorMode ? 'vendor' : 'customer',
        vendorStatus: vendorMode ? 'pending_contract' : null,
      });
    }

    return NextResponse.json({ message: 'Errore imprevisto' }, { status: 500 });
  } catch (err) {
    console.error('Auth auto error:', err);
    return NextResponse.json({ message: 'Errore del server. Riprova.' }, { status: 500 });
  }
}

/** Quick JWT login — returns token or null */
async function tryLogin(baseUrl: string, email: string, password: string): Promise<string | null> {
  try {
    const res = await fetch(`${baseUrl}/wp-json/jwt-auth/v1/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, password }),
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) {
      const data = await res.json();
      return data.data?.token || data.token || null;
    }
  } catch { /* timeout */ }
  return null;
}

/** Fetch WC customer by email — short timeout, best effort */
async function fetchCustomer(baseUrl: string, auth: string, email: string) {
  try {
    const res = await fetch(`${baseUrl}/wp-json/wc/v3/customers?email=${encodeURIComponent(email)}&${auth}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const customers = await res.json();
      return customers[0] || null;
    }
  } catch { /* timeout — meta won't be available but login still works */ }
  return null;
}

/** Save _is_vendor meta — fire and forget, don't block response */
function saveVendorMeta(baseUrl: string, auth: string, email: string, userId?: number) {
  const doSave = async () => {
    try {
      // If we don't have userId, fetch it first
      let id = userId;
      if (!id) {
        const customer = await fetchCustomer(baseUrl, auth, email);
        id = customer?.id;
      }
      if (!id) return;

      await fetch(`${baseUrl}/wp-json/wc/v3/customers/${id}?${auth}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          meta_data: [
            { key: '_is_vendor', value: 'true' },
            { key: '_vendor_status', value: 'pending_contract' },
            { key: '_vendor_registered_at', value: new Date().toISOString() },
          ],
        }),
      });
      console.log(`Vendor meta saved for ${email} (id: ${id})`);
    } catch (err) {
      console.error(`Failed to save vendor meta for ${email}:`, err);
    }
  };
  // Don't await — fire in background
  doSave();
}
