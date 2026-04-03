'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import type { Ticket, TicketStatus } from '@/lib/tickets';

const STATUS_COLORS: Record<TicketStatus, string> = {
  open: 'bg-red-100 text-red-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  closed: 'bg-green-100 text-green-700',
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Aperto',
  in_progress: 'In lavorazione',
  closed: 'Chiuso',
};

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
}

export default function VendorTicketsPage() {
  const { user } = useAuthStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    // Vendors see tickets where their orders are referenced — fetch all open/in_progress
    fetch('/api/tickets?status=open')
      .then(r => r.json())
      .then(data => { setTickets(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleReply = async () => {
    if (!selected || !reply.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/tickets/${selected.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'vendor', authorName: user?.firstName ? `${user.firstName} (Produttore)` : 'Produttore', content: reply.trim() }),
      });
      const updated = await res.json();
      setSelected(updated);
      setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
      setReply('');
    } catch { /* ignore */ }
    setSending(false);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh] text-[#888]">Caricamento…</div>;

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-[20px] font-bold text-[#005667] mb-5">Assistenza clienti</h1>

      {tickets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e8e4dc] p-12 text-center text-[14px] text-[#888]">Nessun ticket aperto</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
          {/* List */}
          <div className="bg-white rounded-2xl border border-[#e8e4dc] shadow-sm overflow-hidden">
            {tickets.map(t => (
              <button key={t.id} onClick={() => setSelected(t)}
                className={`w-full text-left p-4 border-b border-[#f5f5f5] hover:bg-[#f9f7f2] transition-colors ${selected?.id === t.id ? 'bg-[#f0f8f5] border-l-2 border-l-[#005667]' : ''}`}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-[13px] font-semibold text-[#1a1a1a] truncate">{t.subject}</p>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold ${STATUS_COLORS[t.status]}`}>{STATUS_LABELS[t.status]}</span>
                </div>
                <p className="text-[11px] text-[#888]">{t.customerName}{t.orderId ? ` · #${t.orderId}` : ''}</p>
                <p className="text-[10px] text-[#bbb] mt-0.5">{formatDate(t.updatedAt)}</p>
              </button>
            ))}
          </div>

          {/* Detail */}
          {selected ? (
            <div className="bg-white rounded-2xl border border-[#e8e4dc] shadow-sm flex flex-col overflow-hidden max-h-[calc(100vh-200px)]">
              <div className="px-5 py-4 border-b border-[#f0f0f0]">
                <h2 className="text-[15px] font-bold text-[#1a1a1a]">{selected.subject}</h2>
                <p className="text-[12px] text-[#888] mt-0.5">{selected.customerName}{selected.orderId ? ` · Ordine #${selected.orderId}` : ''}</p>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {selected.messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.from === 'customer' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.from === 'customer' ? 'bg-[#f5f3ee]' : 'bg-[#005667] text-white'}`}>
                      <p className={`text-[10px] font-semibold mb-1 ${msg.from === 'customer' ? 'text-[#888]' : 'text-[#d9c39a]'}`}>{msg.authorName} · {formatDate(msg.createdAt)}</p>
                      <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-4 border-t border-[#f0f0f0]">
                <textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Scrivi una risposta al cliente…" rows={3}
                  className="w-full px-4 py-3 text-[13px] border border-[#e8e4dc] rounded-xl focus:outline-none focus:border-[#005667] resize-none placeholder:text-[#bbb]" />
                <div className="flex justify-end mt-2">
                  <button onClick={handleReply} disabled={sending || !reply.trim()}
                    className="px-5 py-2.5 bg-[#005667] text-white rounded-lg text-[13px] font-semibold hover:bg-[#004555] transition-colors disabled:opacity-50">
                    {sending ? 'Invio…' : 'Rispondi'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#e8e4dc] shadow-sm flex items-center justify-center text-[13px] text-[#888]">
              Seleziona un ticket
            </div>
          )}
        </div>
      )}
    </div>
  );
}
