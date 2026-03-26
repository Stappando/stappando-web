import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';
import { sendEmail } from '@/lib/mail/mandrill';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.orderId) {
      return NextResponse.json({ error: 'Dati non validi' }, { status: 400 });
    }

    const wc = getWCSecrets();
    const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

    // Fetch order details for email
    const orderRes = await fetch(`${wc.baseUrl}/wp-json/wc/v3/orders/${body.orderId}?${auth}`);
    const order = orderRes.ok ? await orderRes.json() : null;

    const customerName = body.customerName || `${order?.billing?.first_name || ''} ${order?.billing?.last_name || ''}`.trim() || 'Cliente';
    const customerEmail = body.customerEmail || order?.billing?.email || '';
    const orderNumber = body.orderNumber || order?.number || body.orderId;
    const shippingAddress = order ? `${order.shipping?.address_1 || ''}, ${order.shipping?.postcode || ''} ${order.shipping?.city || ''}` : '';

    // Build products list for email
    const productsList = (body.productNames || []).map((p: string, i: number) => `<li style="padding:4px 0;color:#444;font-size:14px;">${p}${body.productQtys?.[i] ? ` (x${body.productQtys[i]})` : ''}</li>`).join('');

    const pickupInfo = body.pickup === 'home'
      ? `Ritiro a domicilio — ${body.pickupDate || 'data da definire'} · ${body.pickupSlot || ''}`
      : 'Porto il pacco alle Poste';

    // 1. Add reso note to order
    await fetch(`${wc.baseUrl}/wp-json/wc/v3/orders/${body.orderId}/notes?${auth}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        note: `Richiesta reso — Motivo: ${body.reason} | Modalità: ${pickupInfo} | Prodotti: ${body.items?.length || 0} | Rimborso stimato: €${body.refundAmount}`,
        customer_note: true,
      }),
    });

    // 2. Update order meta with return status
    await fetch(`${wc.baseUrl}/wp-json/wc/v3/orders/${body.orderId}?${auth}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meta_data: [
          { key: '_return_status', value: 'requested' },
          { key: '_return_date', value: new Date().toISOString() },
          { key: '_return_reason', value: body.reason },
          { key: '_return_pickup', value: body.pickup },
          { key: '_return_products', value: JSON.stringify(body.items || []) },
          { key: '_return_refund_amount', value: String(body.refundAmount || 0) },
          // Keep legacy keys for backward compat
          { key: '_reso_requested', value: 'true' },
        ],
      }),
    });

    // 3. Send email to assistenza@stappando.it
    const staffHtml = `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#005667;padding:24px 28px;border-radius:12px 12px 0 0;">
          <h1 style="color:#fff;font-size:20px;margin:0;">Nuova richiesta reso #${orderNumber}</h1>
        </div>
        <div style="background:#fff;padding:28px;border:1px solid #e8e4dc;border-top:none;border-radius:0 0 12px 12px;">
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:8px 0;color:#888;width:140px;">Cliente</td><td style="padding:8px 0;font-weight:600;">${customerName}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Email</td><td style="padding:8px 0;">${customerEmail}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Ordine</td><td style="padding:8px 0;font-weight:600;">#${orderNumber}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Motivo</td><td style="padding:8px 0;">${body.reason}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Modalità ritiro</td><td style="padding:8px 0;">${pickupInfo}</td></tr>
            ${shippingAddress ? `<tr><td style="padding:8px 0;color:#888;">Indirizzo</td><td style="padding:8px 0;">${shippingAddress}</td></tr>` : ''}
            <tr><td style="padding:8px 0;color:#888;">Rimborso stimato</td><td style="padding:8px 0;font-weight:700;color:#005667;">€${body.refundAmount}</td></tr>
          </table>
          ${productsList ? `<div style="margin-top:16px;padding-top:16px;border-top:1px solid #f0f0f0;"><p style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Prodotti da rendere</p><ul style="margin:0;padding-left:18px;">${productsList}</ul></div>` : ''}
        </div>
      </div>`;

    await sendEmail({
      to: [{ email: 'assistenza@stappando.it', name: 'Assistenza Stappando' }],
      subject: `Nuova richiesta reso #${orderNumber} da ${customerName}`,
      html: staffHtml,
      from_email: 'noreply@stappando.it',
      from_name: 'Stappando Resi',
      tags: ['reso-staff'],
    }).catch(err => console.error('Staff reso email failed:', err));

    // 4. Send confirmation email to customer
    if (customerEmail) {
      const customerHtml = `
        <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#fff;padding:32px 28px;text-align:center;">
            <img src="https://stappando.it/wp-content/uploads/2021/01/logo-stappando.png" alt="Stappando" style="height:32px;margin-bottom:20px;" />
            <div style="width:64px;height:64px;background:#e8f4f1;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
              <span style="font-size:28px;color:#005667;">✓</span>
            </div>
            <h1 style="font-size:22px;color:#1a1a1a;margin:0 0 8px;">Richiesta reso ricevuta</h1>
            <p style="font-size:14px;color:#888;margin:0;">Ordine #${orderNumber}</p>
          </div>
          <div style="background:#f8f6f1;padding:24px 28px;border-radius:12px;margin:0 28px;">
            <p style="font-size:14px;color:#444;line-height:1.6;margin:0 0 16px;">
              Ciao ${customerName.split(' ')[0]},<br/>abbiamo ricevuto la tua richiesta di reso. Il nostro team la esaminerà entro 24 ore.
            </p>
            <table style="width:100%;font-size:13px;border-collapse:collapse;">
              <tr><td style="padding:6px 0;color:#888;">Motivo</td><td style="padding:6px 0;text-align:right;">${body.reason}</td></tr>
              <tr><td style="padding:6px 0;color:#888;">Modalità</td><td style="padding:6px 0;text-align:right;">${body.pickup === 'home' ? 'Ritiro a domicilio' : 'Porto alle Poste'}</td></tr>
              <tr style="border-top:1px solid #e0dbd4;"><td style="padding:10px 0 6px;font-weight:600;">Rimborso stimato</td><td style="padding:10px 0 6px;text-align:right;font-weight:700;color:#005667;font-size:16px;">€${body.refundAmount}</td></tr>
            </table>
          </div>
          <div style="padding:24px 28px;text-align:center;">
            <p style="font-size:13px;color:#888;margin:0 0 8px;">Tempi di rimborso: <strong>5-7 giorni lavorativi</strong> dall'approvazione</p>
            <p style="font-size:12px;color:#aaa;margin:0;">Per qualsiasi domanda: assistenza@stappando.it</p>
          </div>
        </div>`;

      await sendEmail({
        to: [{ email: customerEmail, name: customerName }],
        subject: `Abbiamo ricevuto la tua richiesta di reso #${orderNumber}`,
        html: customerHtml,
        from_email: 'noreply@stappando.it',
        from_name: 'Stappando',
        tags: ['reso-customer'],
      }).catch(err => console.error('Customer reso email failed:', err));
    }

    console.log(`Reso requested for order ${orderNumber} — emails sent`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Reso API error:', err);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
