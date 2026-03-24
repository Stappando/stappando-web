import { NextResponse } from 'next/server';
import { api } from '@/lib/api';
import { isValidEmail } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, message: 'Body JSON non valido' }, { status: 400 });
    }

    if (!isValidEmail(body.email)) {
      return NextResponse.json({ success: false, message: 'Email non valida' }, { status: 400 });
    }

    const result = await api.subscribeNewsletter(body.email);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ success: false, message: 'Errore del server' }, { status: 500 });
  }
}
