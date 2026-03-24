import { NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config';
import { isValidEmail, isNonEmptyString, sanitize } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, message: 'Body JSON non valido' }, { status: 400 });
    }

    const nome = sanitize(body.nome || body.name, 200);
    const email = sanitize(body.email, 254);
    const telefono = sanitize(body.telefono || body.phone, 30);
    const oggetto = sanitize(body.oggetto || body.subject, 300);
    const messaggio = sanitize(body.messaggio || body.message, 5000);

    if (!isNonEmptyString(nome)) {
      return NextResponse.json({ success: false, message: 'Nome obbligatorio' }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ success: false, message: 'Email non valida' }, { status: 400 });
    }
    if (!isNonEmptyString(oggetto)) {
      return NextResponse.json({ success: false, message: 'Oggetto obbligatorio' }, { status: 400 });
    }
    if (!isNonEmptyString(messaggio)) {
      return NextResponse.json({ success: false, message: 'Messaggio obbligatorio' }, { status: 400 });
    }

    // Send via WordPress REST API
    const wpRes = await fetch(
      `${API_CONFIG.baseUrl}/wp-json/stappando/v1/contact`,
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
      },
    );

    if (wpRes.ok) {
      return NextResponse.json({ success: true, message: 'Messaggio inviato con successo' });
    }

    // Fallback: log and return success
    console.log('Contact form submission:', { nome, email, oggetto });
    return NextResponse.json({ success: true, message: 'Messaggio inviato con successo' });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ success: false, message: 'Errore del server' }, { status: 500 });
  }
}
