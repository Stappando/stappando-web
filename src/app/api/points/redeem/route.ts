import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';
import { sendEmail } from '@/lib/mail/mandrill';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.userId || !body?.points || !body?.email) {
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });
    }

    const points = Math.floor(body.points);
    if (points < 100 || points % 100 !== 0) {
      return NextResponse.json({ error: 'Minimo 100 punti, multipli di 100' }, { status: 400 });
    }

    const euroValue = (points / 100).toFixed(2);
    const wc = getWCSecrets();
    const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

    // 1. Verify user has enough points
    const pointsRes = await fetch(`${wc.baseUrl}/wp-json/stp-app/v1/points/${body.userId}`);
    if (!pointsRes.ok) {
      return NextResponse.json({ error: 'Impossibile verificare il saldo punti' }, { status: 500 });
    }
    const pointsData = await pointsRes.json();
    const currentPoints = pointsData.points || 0;

    if (currentPoints < points) {
      return NextResponse.json({ error: `Punti insufficienti. Hai ${currentPoints} punti.` }, { status: 400 });
    }

    // 2. Generate unique coupon code
    const timestamp = Date.now().toString(36).toUpperCase();
    const code = `POP-${body.userId}-${timestamp}`;

    // 3. Create WC coupon
    const couponRes = await fetch(`${wc.baseUrl}/wp-json/wc/v3/coupons?${auth}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        discount_type: 'fixed_cart',
        amount: euroValue,
        individual_use: false,
        usage_limit: 1,
        usage_limit_per_user: 1,
        email_restrictions: [body.email],
        description: `Riscatto ${points} Punti POP — ${body.firstName || ''} ${body.lastName || ''}`,
        meta_data: [
          { key: '_from_points', value: String(points) },
          { key: '_redeemed_by', value: String(body.userId) },
          { key: '_redeemed_at', value: new Date().toISOString() },
        ],
      }),
    });

    if (!couponRes.ok) {
      const err = await couponRes.json().catch(() => ({}));
      console.error('Coupon creation failed:', err);
      return NextResponse.json({ error: 'Errore nella creazione del codice sconto' }, { status: 500 });
    }

    // 4. Deduct points via YITH API (negative points = deduction)
    try {
      await fetch(`${wc.baseUrl}/wp-json/yith-ywpar/v1/points/add?${auth}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: body.userId,
          points: -points,
          description: `Riscatto ${points} punti → coupon ${code}`,
        }),
      });
    } catch (err) {
      console.error('YITH points deduction failed, trying meta fallback:', err);
      // Fallback: update customer meta directly
      try {
        const newBalance = currentPoints - points;
        await fetch(`${wc.baseUrl}/wp-json/wc/v3/customers/${body.userId}?${auth}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            meta_data: [{ key: '_ywpar_user_total_points', value: String(newBalance) }],
          }),
        });
      } catch (fallbackErr) {
        console.error('Meta fallback also failed:', fallbackErr);
      }
    }

    // 5. Send confirmation email
    const firstName = body.firstName || 'Cliente';
    try {
      await sendEmail({
        to: [{ email: body.email, name: firstName }],
        subject: 'Il tuo codice sconto POP è pronto!',
        html: `
          <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#fff;padding:32px 28px;text-align:center;">
              <img src="https://stappando.it/wp-content/uploads/2021/01/logo-stappando.png" alt="Stappando" style="height:32px;margin-bottom:24px;" />
              <h1 style="font-size:22px;color:#1a1a1a;margin:0 0 8px;">Il tuo codice sconto è pronto</h1>
              <p style="font-size:14px;color:#888;margin:0 0 24px;">Hai riscattato ${points} Punti POP</p>
              <div style="background:#f8f6f1;border:2px dashed #005667;border-radius:12px;padding:24px;margin-bottom:24px;">
                <p style="font-size:12px;color:#888;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.05em;">Il tuo codice</p>
                <p style="font-size:28px;font-weight:700;color:#005667;letter-spacing:0.1em;margin:0;font-family:monospace;">${code}</p>
                <p style="font-size:18px;font-weight:700;color:#005667;margin:8px 0 0;">vale ${euroValue}€</p>
              </div>
              <p style="font-size:14px;color:#444;line-height:1.6;margin:0 0 8px;">Usa questo codice al checkout per ottenere lo sconto.</p>
              <p style="font-size:12px;color:#888;margin:0;">Valido per un solo ordine · Cumulabile con altre promozioni</p>
            </div>
            <div style="text-align:center;padding:16px;">
              <a href="https://stappando-web.vercel.app/cerca" style="display:inline-block;background:#005667;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Scopri i vini →</a>
            </div>
          </div>`,
        from_email: 'noreply@stappando.it',
        from_name: 'Stappando',
        tags: ['points-redeem'],
      });
    } catch (emailErr) {
      console.error('Redeem email failed:', emailErr);
    }

    console.log(`Points redeemed: ${points} pts → coupon ${code} (€${euroValue}) for user ${body.userId}`);

    return NextResponse.json({
      success: true,
      code,
      euroValue,
      pointsUsed: points,
      remainingPoints: currentPoints - points,
    });
  } catch (err) {
    console.error('Points redeem error:', err);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
