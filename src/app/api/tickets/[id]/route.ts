import { NextRequest, NextResponse } from 'next/server';
import { getTicket, updateTicketStatus, type TicketStatus } from '@/lib/tickets';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (!id) return NextResponse.json({ error: 'ID non valido' }, { status: 400 });

  try {
    const ticket = await getTicket(id);
    if (!ticket) return NextResponse.json({ error: 'Ticket non trovato' }, { status: 404 });
    return NextResponse.json(ticket);
  } catch (err) {
    console.error('GET /api/tickets/[id] error:', err);
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (!id) return NextResponse.json({ error: 'ID non valido' }, { status: 400 });

  let body: { status?: TicketStatus };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'JSON non valido' }, { status: 400 }); }

  if (!body.status) return NextResponse.json({ error: 'Status obbligatorio' }, { status: 400 });

  try {
    const ticket = await updateTicketStatus(id, body.status);
    return NextResponse.json(ticket);
  } catch (err) {
    console.error('PATCH /api/tickets/[id] error:', err);
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}
