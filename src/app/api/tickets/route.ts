import { NextRequest, NextResponse } from 'next/server';
import { createTicket, listTickets, type TicketCategory } from '@/lib/tickets';

export const dynamic = 'force-dynamic';

/** GET /api/tickets?customerId=123&status=open&search=... */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const customerId = searchParams.get('customerId');
  const status = searchParams.get('status') as 'open' | 'in_progress' | 'closed' | 'all' | null;
  const search = searchParams.get('search') || undefined;

  try {
    const tickets = await listTickets({
      customerId: customerId ? parseInt(customerId, 10) : undefined,
      status: status || 'all',
      search,
      perPage: 100,
    });
    return NextResponse.json(tickets);
  } catch (err) {
    console.error('GET /api/tickets error:', err);
    return NextResponse.json([], { status: 200 });
  }
}

/** POST /api/tickets — create a new ticket */
export async function POST(req: NextRequest) {
  let body: {
    customerId?: number;
    customerEmail?: string;
    customerName?: string;
    subject?: string;
    category?: TicketCategory;
    orderId?: string;
    message?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON non valido' }, { status: 400 });
  }

  if (!body.customerId || !body.customerEmail || !body.subject || !body.message) {
    return NextResponse.json({ error: 'Campi obbligatori mancanti' }, { status: 400 });
  }

  try {
    const ticket = await createTicket({
      customerId: body.customerId,
      customerEmail: body.customerEmail,
      customerName: body.customerName || '',
      subject: body.subject,
      category: body.category || 'altro',
      orderId: body.orderId,
      message: body.message,
    });
    return NextResponse.json(ticket, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('POST /api/tickets error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
