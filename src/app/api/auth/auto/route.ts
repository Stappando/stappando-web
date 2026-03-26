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

    // ─── STEP 1: Try login (JWT is fast ~2-3s) ────────
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
        const customer = await fetchCustomer(wc.baseUrl, auth, email);
        const isVendorMeta = customer?.meta_data?.some((m: { key: string; value: string }) => m.key === '_is_vendor' && m.value === 'true');
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
          role: isVendorMeta ? 'vendor' : (customer?.role || 'customer'),
          isVendor: isVendorMeta || false,
        });
      }
    }

    // ─── STEP 2: Register via WP REST API (much faster than WC) ──
    // Use WC consumer key/secret as Basic Auth (they have admin access)
    const wpBasicAuth = Buffer.from(`${wc.consumerKey}:${wc.consumerSecret}`).toString('base64');

    // First try: WordPress users endpoint (fast, no WC hooks)
    let userId = 0;
    let registered = false;

    try {
      const wpRegRes = await fetch(`${wc.baseUrl}/wp-json/wc/v3/customers?${auth}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(50000),
        body: JSON.stringify({
          email,
          password,
          username: email,
          first_name: '',
          last_name: '',
          meta_data: vendorMode ? [
            { key: '_is_vendor', value: 'true' },
            { key: '_vendor_status', value: 'pending_contract' },
            { key: '_vendor_registered_at', value: new Date().toISOString() },
          ] : [],
        }),
      });

      if (wpRegRes.ok) {
        const wpData = await wpRegRes.json();
        userId = wpData.id;
        registered = true;
      } else {
        const errData = await wpRegRes.json().catch(() => ({}));
        const msg = (errData.message || errData.code || '').toLowerCase();
        if (msg.includes('already') || msg.includes('exist') || msg.includes('già') || msg.includes('registration')) {
          return NextResponse.json({ message: 'Email già registrata. Controlla la password.' }, { status: 401 });
        }
        return NextResponse.json({ message: errData.message || 'Errore registrazione' }, { status: 400 });
      }
    } catch (regErr) {
      // WC API timed out — try simpler approach: just check if email exists
      console.error('WC register timeout, checking if user was created:', regErr);

      // Sometimes WC creates the user but times out before responding
      // Wait a moment and try to login
      await new Promise(r => setTimeout(r, 2000));

      const retryLogin = await fetch(`${wc.baseUrl}/wp-json/jwt-auth/v1/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
        signal: AbortSignal.timeout(10000),
      }).catch(() => null);

      if (retryLogin?.ok) {
        const retryData = await retryLogin.json();
        const token = retryData.data?.token || retryData.token;
        if (token) {
          return NextResponse.json({
            action: 'registered',
            user: { id: 0, email, firstName: '', lastName: '', username: email },
            token,
            role: vendorMode ? 'vendor' : 'customer',
            isVendor: vendorMode,
          });
        }
      }

      return NextResponse.json({ message: 'Il server è lento. Riprova tra qualche secondo.' }, { status: 503 });
    }

    // ─── STEP 3: Auto-login after registration ─────────
    if (registered) {
      const loginRes = await fetch(`${wc.baseUrl}/wp-json/jwt-auth/v1/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
        signal: AbortSignal.timeout(15000),
      });

      if (loginRes.ok) {
        const loginData = await loginRes.json();
        const token = loginData.data?.token || loginData.token;
        return NextResponse.json({
          action: 'registered',
          user: { id: userId, email, firstName: '', lastName: '', username: email },
          token: token || null,
          role: vendorMode ? 'vendor' : 'customer',
          isVendor: vendorMode,
        });
      }

      // Registration succeeded but login failed — user can try again
      return NextResponse.json({
        action: 'registered_no_login',
        message: 'Account creato! Chiudi e accedi con le tue credenziali.',
        user: { id: userId, email, firstName: '', lastName: '', username: email },
        role: vendorMode ? 'vendor' : 'customer',
      });
    }

    return NextResponse.json({ message: 'Errore imprevisto' }, { status: 500 });
  } catch (err) {
    console.error('Auth auto error:', err);
    return NextResponse.json({ message: 'Errore del server. Riprova.' }, { status: 500 });
  }
}

async function fetchCustomer(baseUrl: string, auth: string, email: string) {
  try {
    const res = await fetch(`${baseUrl}/wp-json/wc/v3/customers?email=${encodeURIComponent(email)}&${auth}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const customers = await res.json();
      return customers[0] || null;
    }
  } catch { /* ignore */ }
  return null;
}
