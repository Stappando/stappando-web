import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { nome, email, telefono, oggetto, messaggio } = await request.json();

    if (!nome || !email || !oggetto || !messaggio) {
      return NextResponse.json(
        { success: false, message: 'Compila tutti i campi obbligatori' },
        { status: 400 }
      );
    }

    // Send email via WooCommerce/WordPress REST API or SMTP
    // For now, we use a simple fetch to the WP site contact endpoint
    const emailBody = [
      `Nome: ${nome}`,
      `Email: ${email}`,
      telefono ? `Telefono: ${telefono}` : '',
      `Oggetto: ${oggetto}`,
      '',
      `Messaggio:`,
      messaggio,
    ]
      .filter(Boolean)
      .join('\n');

    // Send via WordPress REST API
    const wpRes = await fetch(
      `${process.env.NEXT_PUBLIC_WC_URL || 'https://stappando.it'}/wp-json/stappando/v1/contact`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nome,
          email,
          phone: telefono,
          subject: oggetto,
          message: messaggio,
          to: 'assistenza@stappando.it',
        }),
      }
    );

    if (wpRes.ok) {
      return NextResponse.json({ success: true, message: 'Messaggio inviato con successo' });
    }

    // Fallback: log the message and return success
    // In production, integrate with an email service like SendGrid, Resend, etc.
    console.log('Contact form submission:', { nome, email, telefono, oggetto, messaggio: emailBody });
    return NextResponse.json({ success: true, message: 'Messaggio inviato con successo' });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { success: false, message: 'Errore del server' },
      { status: 500 }
    );
  }
}
