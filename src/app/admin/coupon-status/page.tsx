'use client';

import { useState, useEffect, useCallback } from 'react';

interface CouponInfo {
  code: string;
  status: string;
  usedAt: string;
  expires: string;
}

interface CustomerRow {
  id: number;
  name: string;
  email: string;
  registered: string;
  coupon1: CouponInfo;
  coupon2: CouponInfo;
}

const FILTERS = [
  { id: 'all', label: 'Tutti' },
  { id: 'c1-used-waiting', label: 'Coupon 1 usato, in attesa C2' },
  { id: 'c2-used', label: 'Coupon 2 usato' },
  { id: 'expired', label: 'Scaduti senza utilizzo' },
];

export default function CouponStatusPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [filter, setFilter] = useState('all');
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async (pwd: string, f: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/coupon-status?filter=${f}`, {
        headers: { 'x-admin-password': pwd },
      });
      if (res.status === 401) {
        setAuthed(false);
        setError('Password non valida');
        return;
      }
      const data = await res.json();
      setCustomers(data.customers || []);
      setAuthed(true);
    } catch {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(password, filter);
  };

  useEffect(() => {
    if (authed) fetchData(password, filter);
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  function statusBadge(status: string) {
    if (status === 'usato') return <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">Usato</span>;
    if (status === 'scaduto') return <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full">Scaduto</span>;
    if (status === 'attivo') return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">Attivo</span>;
    return <span className="text-[10px] text-gray-400">—</span>;
  }

  function formatDate(iso: string) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white rounded-xl shadow p-8 w-full max-w-sm">
          <h1 className="text-lg font-bold mb-4">Admin — Stato Coupon</h1>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password admin"
            className="w-full h-11 px-4 rounded-lg border border-gray-200 text-sm mb-3"
          />
          <button type="submit" className="w-full py-2.5 bg-[#005667] text-white rounded-lg font-semibold text-sm">
            Accedi
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Stato Coupon Clienti</h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === f.id
                  ? 'bg-[#005667] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-[#005667]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Caricamento...</div>
        ) : customers.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Nessun cliente con coupon trovato</div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Cliente</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Registrato</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Coupon 1</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Stato</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Coupon 2</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Stato</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-gray-500">{c.email}</td>
                    <td className="px-4 py-3 text-gray-500 text-[12px]">{formatDate(c.registered)}</td>
                    <td className="px-4 py-3">
                      <code className="text-[11px] bg-gray-100 px-1.5 py-0.5 rounded">{c.coupon1.code || '—'}</code>
                      {c.coupon1.usedAt && <span className="block text-[10px] text-gray-400 mt-0.5">{formatDate(c.coupon1.usedAt)}</span>}
                    </td>
                    <td className="px-4 py-3">{statusBadge(c.coupon1.status)}</td>
                    <td className="px-4 py-3">
                      <code className="text-[11px] bg-gray-100 px-1.5 py-0.5 rounded">{c.coupon2.code || '—'}</code>
                      {c.coupon2.usedAt && <span className="block text-[10px] text-gray-400 mt-0.5">{formatDate(c.coupon2.usedAt)}</span>}
                    </td>
                    <td className="px-4 py-3">{statusBadge(c.coupon2.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-[11px] text-gray-400 mt-4">{customers.length} clienti con coupon</p>
      </div>
    </div>
  );
}
