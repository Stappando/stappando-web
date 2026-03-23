import { NextResponse } from 'next/server';
import { api } from '@/lib/api';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ success: false, message: 'Email richiesta' }, { status: 400 });
    }
    const result = await api.subscribeNewsletter(email);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ success: false, message: 'Errore del server' }, { status: 500 });
  }
}
