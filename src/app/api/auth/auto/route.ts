import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';
import { isValidEmail, sanitize } from '@/lib/validation';

/**
 * Single endpoint: try login → if fails → register → login.
 * One fetch from client, all WC calls server-side.
 */
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
      signal: AbortSignal.timeout(10000),
    });

    if (tokenRes.ok) {
      const tokenData = await tokenRes.json();
      const token = tokenData.data?.token || tokenData.token;
      if (token) {
        // Fetch customer to get role + name
        const customer = await fetchCustomer(wc.baseUrl, auth, email);
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
          role: customer?.role || 'customer',
        });
      }
    }

    // ─── STEP 2: Login failed → Register ────────────────
    const role = vendorMode ? 'wcfm_vendor' : 'customer';
    const regRes = await fetch(`${wc.baseUrl}/wp-json/wc/v3/customers?${auth}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({
        email,
        password,
        first_name: '',
        last_name: '',
        username: email,
        role,
        ...(vendorMode ? {
          meta_data: [
            { key: '_vendor_status', value: 'pending_contract' },
            { key: '_vendor_registered_at', value: new Date().toISOString() },
          ],
        } : {}),
      }),
    });

    const regData = await regRes.json();
    if (!regRes.ok) {
      const msg = regData.message || 'Errore';
      // Email exists but wrong password
      if (msg.includes('already') || msg.includes('exist') || msg.includes('già') || regData.code === 'registration-error-email-exists') {
        return NextResponse.json({ message: 'Email già registrata. Controlla la password.' }, { status: 401 });
      }
      return NextResponse.json({ message: msg }, { status: regRes.status });
    }

    // ─── STEP 3: Register ok → Auto-login ──────────────
    const loginRes = await fetch(`${wc.baseUrl}/wp-json/jwt-auth/v1/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, password }),
      signal: AbortSignal.timeout(10000),
    });

    if (!loginRes.ok) {
      return NextResponse.json({
        action: 'registered_no_login',
        message: 'Account creato. Chiudi e riprova ad accedere.',
        user: { id: regData.id, email, firstName: '', lastName: '', username: email },
        role,
      });
    }

    const loginData = await loginRes.json();
    const token = loginData.data?.token || loginData.token;

    return NextResponse.json({
      action: 'registered',
      user: {
        id: regData.id,
        email,
        firstName: regData.first_name || '',
        lastName: regData.last_name || '',
        username: email,
      },
      token: token || null,
      role,
    });
  } catch (err) {
    console.error('Auth auto error:', err);
    return NextResponse.json({ message: 'Errore del server' }, { status: 500 });
  }
}

async function fetchCustomer(baseUrl: string, auth: string, email: string) {
  try {
    const res = await fetch(`${baseUrl}/wp-json/wc/v3/customers?email=${encodeURIComponent(email)}&${auth}`);
    if (res.ok) {
      const customers = await res.json();
      return customers[0] || null;
    }
  } catch { /* ignore */ }
  return null;
}
