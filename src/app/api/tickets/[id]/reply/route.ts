import { NextRequest, NextResponse } from 'next/server';
import { replyToTicket, type MessageFrom } from '@/lib/tickets';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (!id) return NextResponse.json({ error: 'ID non valido' }, { status: 400 });

  let body: { from?: MessageFrom; authorName?: string; content?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'JSON non valido' }, { status: 400 }); }

  if (!body.content?.trim()) return NextResponse.json({ error: 'Messaggio vuoto' }, { status: 400 });

  try {
    const ticket = await replyToTicket(id, {
      from: body.from || 'customer',
      authorName: body.authorName || 'Cliente',
      content: body.content.trim(),
    });
    return NextResponse.json(ticket);
  } catch (err) {
    console.error('POST /api/tickets/[id]/reply error:', err);
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}
