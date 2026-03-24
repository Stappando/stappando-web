import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';
import { isPositiveInt } from '@/lib/validation';

/** GET /api/customers?id=123 — fetch customer by ID */
export async function GET(req: NextRequest) {
  try {
    const idParam = req.nextUrl.searchParams.get('id');
    if (!isPositiveInt(idParam)) {
      return NextResponse.json({ message: 'Customer ID deve essere un numero positivo' }, { status: 400 });
    }

    const wc = getWCSecrets();
    const url = `${wc.baseUrl}/wp-json/wc/v3/customers/${idParam}?consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ message: 'Cliente non trovato' }, { status: res.status });
    }

    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ message: 'Errore del server' }, { status: 500 });
  }
}

/** PUT /api/customers — update customer { id, ...data } */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ message: 'Body JSON non valido' }, { status: 400 });
    }

    const { id, ...data } = body;
    if (!isPositiveInt(id)) {
      return NextResponse.json({ message: 'Customer ID deve essere un numero positivo' }, { status: 400 });
    }

    const wc = getWCSecrets();
    const url = `${wc.baseUrl}/wp-json/wc/v3/customers/${id}?consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      return NextResponse.json({ message: 'Impossibile aggiornare' }, { status: res.status });
    }

    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ message: 'Errore del server' }, { status: 500 });
  }
}
