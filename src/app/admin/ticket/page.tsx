'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Ticket, TicketStatus } from '@/lib/tickets';

const STATUS_LABELS: Record<TicketStatus | 'all', string> = {
  all: 'Tutti',
  open: 'Aperti',
  in_progress: 'In lavorazione',
  closed: 'Chiusi',
};

const STATUS_COLORS: Record<TicketStatus, string> = {
  open: 'bg-red-100 text-red-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  closed: 'bg-green-100 text-green-700',
};

const CATEGORY_LABELS: Record<string, string> = {
  ordine: 'Ordine',
  prodotto: 'Prodotto',
  pagamento: 'Pagamento',
  spedizione: 'Spedizione',
  reso: 'Reso',
  altro: 'Altro',
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TicketStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);

  const loadTickets = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (filter !== 'all') params.set('status', filter);
    fetch(`/api/tickets?${params}`)
      .then(r => r.json())
      .then(data => { setTickets(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [search, filter]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  const handleReply = async () => {
    if (!selected || !reply.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/tickets/${selected.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'admin', authorName: 'Stappando Support', content: reply.trim() }),
      });
      const updated = await res.json();
      setSelected(updated);
      setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
      setReply('');
    } catch { /* ignore */ }
    setSending(false);
  };

  const handleStatusChange = async (status: TicketStatus) => {
    if (!selected) return;
    setStatusChanging(true);
    try {
      const res = await fetch(`/api/tickets/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const updated = await res.json();
      setSelected(updated);
      setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
    } catch { /* ignore */ }
    setStatusChanging(false);
  };

  return (
    <div className="min-h-screen bg-[#f5f3ee] p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-[22px] font-bold text-[#005667] mb-6">Assistenza clienti</h1>

        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5">
          {/* LEFT — Ticket list */}
          <div className="bg-white rounded-2xl border border-[#e8e4dc] shadow-sm overflow-hidden">
            {/* Filters */}
            <div className="p-4 border-b border-[#f0f0f0] space-y-3">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#bbb]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/></svg>
                <input type="text" placeholder="Cerca ticket o cliente…" value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-[12px] border border-[#e8e4dc] rounded-lg focus:outline-none focus:border-[#005667] placeholder:text-[#bbb]" />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {(Object.keys(STATUS_LABELS) as (TicketStatus | 'all')[]).map(s => (
                  <button key={s} onClick={() => setFilter(s)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${filter === s ? 'bg-[#005667] text-white' : 'border border-[#e8e4dc] text-[#888] hover:border-[#005667] hover:text-[#005667]'}`}>
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Ticket list */}
            <div className="overflow-y-auto max-h-[calc(100vh-280px)]">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-[13px] text-[#888]">Caricamento…</div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-12 text-[13px] text-[#888]">Nessun ticket trovato</div>
              ) : (
                tickets.map(t => (
                  <button key={t.id} onClick={() => setSelected(t)}
                    className={`w-full text-left p-4 border-b border-[#f5f5f5] hover:bg-[#f9f7f2] transition-colors ${selected?.id === t.id ? 'bg-[#f0f8f5] border-l-2 border-l-[#005667]' : ''}`}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-[13px] font-semibold text-[#1a1a1a] truncate flex-1">{t.subject}</p>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold ${STATUS_COLORS[t.status]}`}>{STATUS_LABELS[t.status]}</span>
                    </div>
                    <p className="text-[11px] text-[#888] truncate">{t.customerName} · {t.customerEmail}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-[#bbb]">{CATEGORY_LABELS[t.category] || t.category}</span>
                      <span className="text-[10px] text-[#bbb]">{formatDate(t.updatedAt)}</span>
                    </div>
                    <p className="text-[11px] text-[#666] mt-1 line-clamp-1">
                      {t.messages[t.messages.length - 1]?.content}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* RIGHT — Ticket detail */}
          {selected ? (
            <div className="bg-white rounded-2xl border border-[#e8e4dc] shadow-sm flex flex-col overflow-hidden max-h-[calc(100vh-120px)]">
              {/* Header */}
              <div className="px-6 py-4 border-b border-[#f0f0f0] flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-[16px] font-bold text-[#1a1a1a]">{selected.subject}</h2>
                  <p className="text-[12px] text-[#888] mt-0.5">{selected.customerName} &middot; {selected.customerEmail}{selected.orderId ? ` · Ordine #${selected.orderId}` : ''}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${STATUS_COLORS[selected.status]}`}>{STATUS_LABELS[selected.status]}</span>
                    <span className="text-[11px] text-[#aaa]">{CATEGORY_LABELS[selected.category] || selected.category}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {selected.status !== 'in_progress' && <button onClick={() => handleStatusChange('in_progress')} disabled={statusChanging} className="px-3 py-1.5 text-[11px] font-semibold border border-yellow-400 text-yellow-700 rounded-lg hover:bg-yellow-50 transition-colors disabled:opacity-50">In lavorazione</button>}
                  {selected.status !== 'closed' && <button onClick={() => handleStatusChange('closed')} disabled={statusChanging} className="px-3 py-1.5 text-[11px] font-semibold border border-green-400 text-green-700 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50">Chiudi</button>}
                  {selected.status === 'closed' && <button onClick={() => handleStatusChange('open')} disabled={statusChanging} className="px-3 py-1.5 text-[11px] font-semibold border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50">Riapri</button>}
                </div>
              </div>

              {/* Messages thread */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {selected.messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.from === 'customer' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.from === 'customer' ? 'bg-[#f5f3ee] text-[#1a1a1a]' : 'bg-[#005667] text-white'}`}>
                      <p className={`text-[10px] font-semibold mb-1 ${msg.from === 'customer' ? 'text-[#888]' : 'text-[#d9c39a]'}`}>
                        {msg.authorName} · {formatDate(msg.createdAt)}
                      </p>
                      <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply box */}
              {selected.status !== 'closed' && (
                <div className="px-6 py-4 border-t border-[#f0f0f0]">
                  <textarea
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    placeholder="Scrivi una risposta…"
                    rows={3}
                    className="w-full px-4 py-3 text-[13px] border border-[#e8e4dc] rounded-xl focus:outline-none focus:border-[#005667] resize-none placeholder:text-[#bbb]"
                  />
                  <div className="flex justify-end mt-2">
                    <button onClick={handleReply} disabled={sending || !reply.trim()}
                      className="px-5 py-2.5 bg-[#005667] text-white rounded-lg text-[13px] font-semibold hover:bg-[#004555] transition-colors disabled:opacity-50">
                      {sending ? 'Invio…' : 'Rispondi'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#e8e4dc] shadow-sm flex items-center justify-center text-[14px] text-[#888]">
              Seleziona un ticket per visualizzarlo
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
