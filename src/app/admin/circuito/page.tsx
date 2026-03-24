'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

/* ── Types ────────────────────────────────────────────── */

interface CircuitoProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  image: string;
  stock_status: string;
  circuito_priority: number;
  circuito_badge: string;
}

interface SearchResult {
  id: number;
  name: string;
  slug: string;
  price: string;
  image: string;
  tags: number[];
}

const CIRCUITO_TAG_ID = 21993;

/* ── Admin Panel ──────────────────────────────────────── */

export default function CircuitoAdmin() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');

  // Circuito state
  const [products, setProducts] = useState<CircuitoProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [maxProducts] = useState(10);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPriority, setEditPriority] = useState(1);
  const [editBadge, setEditBadge] = useState('');

  const authHeader = useCallback(() => ({
    'Authorization': `Bearer ${password}`,
    'Content-Type': 'application/json',
  }), [password]);

  /** Load circuito products */
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/circuito', { headers: authHeader() });
      if (res.status === 401) { setAuthed(false); return; }
      const data = await res.json();
      if (data.products) setProducts(data.products);
    } catch {
      flash('err', 'Errore nel caricamento');
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  /** Authenticate */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/admin/circuito', {
        headers: { 'Authorization': `Bearer ${password}` },
      });
      if (res.ok) {
        setAuthed(true);
        const data = await res.json();
        if (data.products) setProducts(data.products);
      } else {
        setAuthError('Password non valida');
      }
    } catch {
      setAuthError('Errore di connessione');
    }
  };

  /** Search products */
  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/circuito/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: authHeader(),
      });
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch {
      flash('err', 'Errore nella ricerca');
    } finally {
      setSearching(false);
    }
  };

  /** Add product to circuito */
  const handleAdd = async (productId: number) => {
    try {
      const res = await fetch('/api/admin/circuito', {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({
          productId,
          priority: products.length + 1,
          badge: 'Selezionato dal Sommelier',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      flash('ok', 'Prodotto aggiunto al circuito');
      setSearchResults([]);
      setSearchQuery('');
      loadProducts();
    } catch (err) {
      flash('err', err instanceof Error ? err.message : 'Errore');
    }
  };

  /** Remove product from circuito */
  const handleRemove = async (productId: number) => {
    if (!confirm('Rimuovere questo prodotto dal circuito?')) return;
    try {
      const res = await fetch('/api/admin/circuito', {
        method: 'DELETE',
        headers: authHeader(),
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      flash('ok', 'Prodotto rimosso');
      loadProducts();
    } catch (err) {
      flash('err', err instanceof Error ? err.message : 'Errore');
    }
  };

  /** Update priority/badge */
  const handleUpdate = async (productId: number) => {
    try {
      const res = await fetch('/api/admin/circuito', {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({
          productId,
          priority: editPriority,
          badge: editBadge || 'Selezionato dal Sommelier',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      flash('ok', 'Aggiornato');
      setEditingId(null);
      loadProducts();
    } catch (err) {
      flash('err', err instanceof Error ? err.message : 'Errore');
    }
  };

  function flash(type: 'ok' | 'err', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }

  /* ── Login screen ─────────────────────────────────── */

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-gray-900">Pannello Circuito</h1>
            <p className="text-sm text-gray-500 mt-1">Accesso riservato</p>
          </div>
          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 text-sm text-red-700">{authError}</div>
          )}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password admin"
            className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm mb-4 focus:outline-none focus:border-[#005667] focus:ring-1 focus:ring-[#005667]"
            autoFocus
          />
          <button
            type="submit"
            className="w-full py-3 bg-[#005667] text-white font-semibold rounded-xl hover:bg-[#004556] transition-colors"
          >
            Accedi
          </button>
        </form>
      </div>
    );
  }

  /* ── Main panel ───────────────────────────────────── */

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#005667] text-white px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Circuito Stappando</h1>
            <p className="text-sm text-white/70">
              {products.length}/{maxProducts} prodotti attivi
            </p>
          </div>
          <button
            onClick={() => { setAuthed(false); setPassword(''); }}
            className="text-sm text-white/70 hover:text-white"
          >
            Esci
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Flash message */}
        {message && (
          <div className={`p-3 rounded-xl text-sm font-medium ${
            message.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        {/* Search to add */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-3">Aggiungi prodotto</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Cerca per nome prodotto..."
              className="flex-1 h-10 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#005667]"
            />
            <button
              onClick={handleSearch}
              disabled={searching || searchQuery.trim().length < 2}
              className="px-4 h-10 bg-[#005667] text-white text-sm font-semibold rounded-xl hover:bg-[#004556] disabled:opacity-50"
            >
              {searching ? '...' : 'Cerca'}
            </button>
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {searchResults.map((p) => {
                const alreadyCircuito = p.tags.includes(CIRCUITO_TAG_ID);
                return (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white shrink-0">
                      {p.image && <Image src={p.image} alt="" fill className="object-contain" sizes="40px" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.price} € · ID: {p.id}</p>
                    </div>
                    {alreadyCircuito ? (
                      <span className="text-xs text-[#d9c39a] font-semibold">Già nel circuito</span>
                    ) : (
                      <button
                        onClick={() => handleAdd(p.id)}
                        disabled={products.length >= maxProducts}
                        className="px-3 py-1.5 bg-[#d9c39a] text-[#1a1a1a] text-xs font-semibold rounded-lg hover:bg-[#c9b38a] disabled:opacity-50"
                      >
                        + Aggiungi
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Active circuito products */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">Prodotti attivi</h2>
            <button
              onClick={loadProducts}
              disabled={loading}
              className="text-xs text-[#005667] font-semibold hover:underline"
            >
              {loading ? 'Caricamento...' : 'Aggiorna'}
            </button>
          </div>

          {products.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Nessun prodotto nel circuito</p>
          ) : (
            <div className="space-y-3">
              {products.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50">
                  {/* Image */}
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-white shrink-0 border border-gray-100">
                    {p.image && <Image src={p.image} alt="" fill className="object-contain" sizes="56px" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#d9c39a]/20 text-[#8a7440]">
                        P{p.circuito_priority}
                      </span>
                      <span className="text-[10px] text-gray-500 truncate">
                        {p.circuito_badge}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        if (editingId === p.id) {
                          setEditingId(null);
                        } else {
                          setEditingId(p.id);
                          setEditPriority(p.circuito_priority);
                          setEditBadge(p.circuito_badge);
                        }
                      }}
                      className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                      title="Modifica"
                    >
                      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleRemove(p.id)}
                      className="p-2 rounded-lg hover:bg-red-100 transition-colors"
                      title="Rimuovi"
                    >
                      <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Edit panel (inline) */}
                  {editingId === p.id && (
                    <div className="w-full mt-3 pt-3 border-t border-gray-200 flex flex-wrap items-end gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Priorità</label>
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={editPriority}
                          onChange={(e) => setEditPriority(parseInt(e.target.value) || 1)}
                          className="w-16 h-8 px-2 rounded-lg border border-gray-200 text-sm text-center"
                        />
                      </div>
                      <div className="flex-1 min-w-[180px]">
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Badge</label>
                        <input
                          type="text"
                          maxLength={60}
                          value={editBadge}
                          onChange={(e) => setEditBadge(e.target.value)}
                          className="w-full h-8 px-3 rounded-lg border border-gray-200 text-sm"
                          placeholder="Selezionato dal Sommelier"
                        />
                      </div>
                      <button
                        onClick={() => handleUpdate(p.id)}
                        className="h-8 px-4 bg-[#005667] text-white text-xs font-semibold rounded-lg hover:bg-[#004556]"
                      >
                        Salva
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Capacity bar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>Capacità circuito</span>
            <span className="font-semibold">{products.length}/{maxProducts}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#d9c39a] rounded-full transition-all duration-500"
              style={{ width: `${(products.length / maxProducts) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
