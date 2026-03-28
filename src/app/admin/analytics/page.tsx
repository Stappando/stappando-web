'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAnalyticsStore } from '@/store/analytics';

/* ── Constants ─────────────────────────────────────────── */

const ADMIN_PASSWORD = 'stappando2026';
const PRIMARY = '#005667';

const DATE_RANGES = [
  { id: 'today', label: 'Oggi' },
  { id: '7d', label: '7 giorni' },
  { id: '30d', label: '30 giorni' },
  { id: 'all', label: 'Tutto' },
] as const;

type RangeId = (typeof DATE_RANGES)[number]['id'];

/* ── Helpers ───────────────────────────────────────────── */

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getDateRange(range: RangeId): { from: string; to: string } {
  const now = new Date();
  const to = dateKey(now);
  if (range === 'today') return { from: to, to };
  if (range === '7d') {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    return { from: dateKey(d), to };
  }
  if (range === '30d') {
    const d = new Date(now);
    d.setDate(d.getDate() - 29);
    return { from: dateKey(d), to };
  }
  return { from: '2020-01-01', to };
}

function fmtNum(n: number): string {
  return n.toLocaleString('it-IT');
}

function fmtPct(n: number): string {
  if (!isFinite(n)) return '0%';
  return n.toFixed(1) + '%';
}

function fmtEuro(n: number): string {
  return n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
}

function prettifyPath(p: string): string {
  if (p === '/') return 'Homepage';
  return p
    .replace(/^\//, '')
    .replace(/\//g, ' > ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ── CSV Export ────────────────────────────────────────── */

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const bom = '\uFEFF';
  const csv = bom + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Page Component ────────────────────────────────────── */

export default function AnalyticsPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState('');
  const [range, setRange] = useState<RangeId>('7d');
  const [activeTab, setActiveTab] = useState<'ricerche' | 'conversioni' | 'flusso' | 'prodotti'>('ricerche');

  const analyticsData = useAnalyticsStore((s) => s.getData());
  const clearData = useAnalyticsStore((s) => s.clearData);

  // Hydration guard
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
      setError('');
    } else {
      setError('Password non valida');
    }
  };

  /* ── Filtered daily data ─────────────────────────────── */

  const filteredDaily = useMemo(() => {
    const { from, to } = getDateRange(range);
    return Object.values(analyticsData.daily).filter((d) => d.date >= from && d.date <= to);
  }, [analyticsData.daily, range]);

  const totals = useMemo(() => {
    return filteredDaily.reduce(
      (acc, d) => ({
        pageViews: acc.pageViews + d.pageViews,
        searches: acc.searches + d.searches,
        productViews: acc.productViews + d.productViews,
        cartAdds: acc.cartAdds + d.cartAdds,
        checkoutStarts: acc.checkoutStarts + d.checkoutStarts,
        purchases: acc.purchases + d.purchases,
        revenue: acc.revenue + d.revenue,
        itemsSold: acc.itemsSold + d.itemsSold,
      }),
      { pageViews: 0, searches: 0, productViews: 0, cartAdds: 0, checkoutStarts: 0, purchases: 0, revenue: 0, itemsSold: 0 },
    );
  }, [filteredDaily]);

  /* ── Search data ─────────────────────────────────────── */

  const searchData = useMemo(() => {
    const allSearches = Object.values(analyticsData.searches);
    const sorted = [...allSearches].sort((a, b) => b.count - a.count);
    const top20 = sorted.slice(0, 20);
    const totalSearches = allSearches.reduce((s, x) => s + x.count, 0);
    const totalZeroResults = allSearches.reduce((s, x) => s + x.zeroResults, 0);
    const zeroOnly = allSearches.filter((s) => s.zeroResults > 0).sort((a, b) => b.zeroResults - a.zeroResults).slice(0, 20);
    return { top20, totalSearches, totalZeroResults, zeroOnly };
  }, [analyticsData.searches]);

  /* ── Product data ────────────────────────────────────── */

  const productData = useMemo(() => {
    const all = Object.values(analyticsData.products);
    const byViews = [...all].sort((a, b) => b.views - a.views).slice(0, 20);
    const byCartAdds = [...all].sort((a, b) => b.cartAdds - a.cartAdds).slice(0, 20);
    return { byViews, byCartAdds };
  }, [analyticsData.products]);

  /* ── Path flow data ──────────────────────────────────── */

  const flowData = useMemo(() => {
    const entries = Object.values(analyticsData.paths);
    // Flatten all transitions and sort by count
    const transitions: { from: string; to: string; count: number }[] = [];
    entries.forEach((step) => {
      Object.entries(step.next).forEach(([to, count]) => {
        transitions.push({ from: step.path, to, count });
      });
    });
    transitions.sort((a, b) => b.count - a.count);
    return transitions.slice(0, 30);
  }, [analyticsData.paths]);

  /* ── CSV Export ──────────────────────────────────────── */

  const handleExport = useCallback(() => {
    if (activeTab === 'ricerche') {
      downloadCSV(
        'ricerche-analytics.csv',
        ['Termine', 'Ricerche', 'Zero Risultati', 'Ultima Ricerca'],
        Object.values(analyticsData.searches)
          .sort((a, b) => b.count - a.count)
          .map((s) => [s.term, String(s.count), String(s.zeroResults), new Date(s.lastSearched).toLocaleString('it-IT')]),
      );
    } else if (activeTab === 'conversioni') {
      downloadCSV(
        'conversioni-analytics.csv',
        ['Data', 'Visite', 'Ricerche', 'Viste Prodotto', 'Aggiunte Carrello', 'Checkout', 'Acquisti', 'Fatturato'],
        filteredDaily.map((d) => [d.date, String(d.pageViews), String(d.searches), String(d.productViews), String(d.cartAdds), String(d.checkoutStarts), String(d.purchases), d.revenue.toFixed(2)]),
      );
    } else if (activeTab === 'flusso') {
      downloadCSV(
        'flusso-analytics.csv',
        ['Da', 'A', 'Transizioni'],
        flowData.map((t) => [t.from, t.to, String(t.count)]),
      );
    } else {
      downloadCSV(
        'prodotti-analytics.csv',
        ['ID', 'Nome', 'Visualizzazioni', 'Aggiunte Carrello', 'Tasso Conversione'],
        Object.values(analyticsData.products)
          .sort((a, b) => b.views - a.views)
          .map((p) => [String(p.id), p.name, String(p.views), String(p.cartAdds), p.views > 0 ? ((p.cartAdds / p.views) * 100).toFixed(1) + '%' : '0%']),
      );
    }
  }, [activeTab, analyticsData, filteredDaily, flowData]);

  /* ── Login screen ────────────────────────────────────── */

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white rounded-xl shadow p-8 w-full max-w-sm">
          <h1 className="text-lg font-bold mb-4">Admin &mdash; Analytics</h1>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password admin"
            className="w-full h-11 px-4 rounded-lg border border-gray-200 text-sm mb-3"
          />
          <button
            type="submit"
            className="w-full py-2.5 text-white rounded-lg font-semibold text-sm"
            style={{ backgroundColor: PRIMARY }}
          >
            Accedi
          </button>
        </form>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Caricamento...</p>
      </div>
    );
  }

  /* ── Dashboard ───────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-xl font-bold text-gray-900">Analytics Dashboard</h1>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            >
              Esporta CSV
            </button>
            <button
              onClick={() => {
                if (confirm('Cancellare tutti i dati analytics?')) clearData();
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-red-200 bg-white text-red-600 hover:bg-red-50"
            >
              Reset dati
            </button>
          </div>
        </div>

        {/* Date range filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {DATE_RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                range === r.id ? 'text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#005667]'
              }`}
              style={range === r.id ? { backgroundColor: PRIMARY } : undefined}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="Visite" value={fmtNum(totals.pageViews)} />
          <StatCard label="Ricerche" value={fmtNum(totals.searches)} />
          <StatCard label="Aggiunte carrello" value={fmtNum(totals.cartAdds)} />
          <StatCard label="Acquisti" value={fmtNum(totals.purchases)} sub={fmtEuro(totals.revenue)} />
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl border border-gray-200 p-1">
          {(
            [
              { id: 'ricerche', label: 'Ricerche' },
              { id: 'conversioni', label: 'Conversioni' },
              { id: 'flusso', label: 'Flusso utente' },
              { id: 'prodotti', label: 'Prodotti' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
              style={activeTab === tab.id ? { backgroundColor: PRIMARY } : undefined}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {activeTab === 'ricerche' && <RicercheTab searchData={searchData} />}
          {activeTab === 'conversioni' && <ConversioniTab totals={totals} daily={filteredDaily} />}
          {activeTab === 'flusso' && <FlussoTab flowData={flowData} />}
          {activeTab === 'prodotti' && <ProdottiTab productData={productData} />}
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────── */

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-[11px] text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

/* ── Ricerche Tab ──────────────────────────────────────── */

function RicercheTab({
  searchData,
}: {
  searchData: {
    top20: { term: string; count: number; zeroResults: number; lastSearched: number }[];
    totalSearches: number;
    totalZeroResults: number;
    zeroOnly: { term: string; count: number; zeroResults: number }[];
  };
}) {
  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-3xl font-bold" style={{ color: PRIMARY }}>{fmtNum(searchData.totalSearches)}</p>
          <p className="text-xs text-gray-500 mt-1">Ricerche totali</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold" style={{ color: PRIMARY }}>{fmtNum(searchData.top20.length)}</p>
          <p className="text-xs text-gray-500 mt-1">Termini unici</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-red-500">{fmtNum(searchData.totalZeroResults)}</p>
          <p className="text-xs text-gray-500 mt-1">Zero risultati</p>
        </div>
      </div>

      {/* Top searched terms */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Top 20 ricerche</h3>
        <div className="space-y-2">
          {searchData.top20.map((s, i) => {
            const maxCount = searchData.top20[0]?.count || 1;
            return (
              <div key={s.term} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-6 text-right">{i + 1}.</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-medium text-gray-900">{s.term}</span>
                    <span className="text-xs text-gray-500">{s.count}x</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(s.count / maxCount) * 100}%`, backgroundColor: PRIMARY }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
          {searchData.top20.length === 0 && <p className="text-sm text-gray-400">Nessuna ricerca registrata</p>}
        </div>
      </div>

      {/* Zero result searches */}
      {searchData.zeroOnly.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Ricerche senza risultati</h3>
          <div className="flex flex-wrap gap-2">
            {searchData.zeroOnly.map((s) => (
              <span key={s.term} className="px-3 py-1 bg-red-50 text-red-700 text-sm rounded-full">
                {s.term} <span className="text-red-400">({s.zeroResults}x)</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Conversioni Tab ───────────────────────────────────── */

function ConversioniTab({
  totals,
  daily,
}: {
  totals: { pageViews: number; searches: number; productViews: number; cartAdds: number; checkoutStarts: number; purchases: number; revenue: number; itemsSold: number };
  daily: { date: string; pageViews: number; searches: number; cartAdds: number; checkoutStarts: number; purchases: number; revenue: number }[];
}) {
  const funnel = [
    { label: 'Visite', value: totals.pageViews },
    { label: 'Ricerche', value: totals.searches },
    { label: 'Viste prodotto', value: totals.productViews },
    { label: 'Aggiunte carrello', value: totals.cartAdds },
    { label: 'Checkout', value: totals.checkoutStarts },
    { label: 'Acquisti', value: totals.purchases },
  ];

  const maxVal = Math.max(...funnel.map((f) => f.value), 1);

  return (
    <div className="space-y-8">
      {/* Funnel visualization */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Funnel di conversione</h3>
        <div className="space-y-3">
          {funnel.map((step, i) => {
            const prevValue = i > 0 ? funnel[i - 1].value : step.value;
            const rate = prevValue > 0 ? (step.value / prevValue) * 100 : 0;
            const barWidth = maxVal > 0 ? (step.value / maxVal) * 100 : 0;
            return (
              <div key={step.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{step.label}</span>
                  <span className="text-sm text-gray-900 font-semibold">
                    {fmtNum(step.value)}
                    {i > 0 && (
                      <span className="text-xs text-gray-400 ml-2">{fmtPct(rate)}</span>
                    )}
                  </span>
                </div>
                <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className="h-full rounded-lg transition-all duration-500"
                    style={{
                      width: `${Math.max(barWidth, step.value > 0 ? 2 : 0)}%`,
                      backgroundColor: PRIMARY,
                      opacity: 1 - i * 0.12,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Overall conversion rate */}
        <div className="mt-4 p-4 rounded-lg bg-gray-50 text-center">
          <p className="text-xs text-gray-500 mb-1">Tasso conversione globale (visite &rarr; acquisti)</p>
          <p className="text-2xl font-bold" style={{ color: PRIMARY }}>
            {fmtPct(totals.pageViews > 0 ? (totals.purchases / totals.pageViews) * 100 : 0)}
          </p>
        </div>
      </div>

      {/* Daily breakdown table */}
      {daily.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Dettaglio giornaliero</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-3 py-2 font-semibold text-gray-600">Data</th>
                  <th className="text-right px-3 py-2 font-semibold text-gray-600">Visite</th>
                  <th className="text-right px-3 py-2 font-semibold text-gray-600">Ricerche</th>
                  <th className="text-right px-3 py-2 font-semibold text-gray-600">Carrello</th>
                  <th className="text-right px-3 py-2 font-semibold text-gray-600">Checkout</th>
                  <th className="text-right px-3 py-2 font-semibold text-gray-600">Acquisti</th>
                  <th className="text-right px-3 py-2 font-semibold text-gray-600">Fatturato</th>
                </tr>
              </thead>
              <tbody>
                {[...daily].sort((a, b) => b.date.localeCompare(a.date)).map((d) => (
                  <tr key={d.date} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium">{d.date}</td>
                    <td className="px-3 py-2 text-right">{d.pageViews}</td>
                    <td className="px-3 py-2 text-right">{d.searches}</td>
                    <td className="px-3 py-2 text-right">{d.cartAdds}</td>
                    <td className="px-3 py-2 text-right">{d.checkoutStarts}</td>
                    <td className="px-3 py-2 text-right">{d.purchases}</td>
                    <td className="px-3 py-2 text-right">{fmtEuro(d.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Flusso Tab ────────────────────────────────────────── */

function FlussoTab({ flowData }: { flowData: { from: string; to: string; count: number }[] }) {
  if (flowData.length === 0) {
    return <p className="text-sm text-gray-400">Nessun dato di navigazione registrato. I percorsi appariranno dopo le prime visite.</p>;
  }

  const maxCount = flowData[0]?.count || 1;

  return (
    <div>
      <h3 className="font-semibold text-gray-900 mb-4">Percorsi pi&ugrave; comuni</h3>
      <div className="space-y-2">
        {flowData.map((t, i) => (
          <div key={`${t.from}-${t.to}-${i}`} className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-6 text-right">{i + 1}.</span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700">
                  <span className="font-medium">{prettifyPath(t.from)}</span>
                  <span className="mx-2 text-gray-400">&rarr;</span>
                  <span className="font-medium">{prettifyPath(t.to)}</span>
                </span>
                <span className="text-xs text-gray-500 ml-2">{t.count}x</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(t.count / maxCount) * 100}%`, backgroundColor: PRIMARY }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Prodotti Tab ──────────────────────────────────────── */

function ProdottiTab({
  productData,
}: {
  productData: {
    byViews: { id: number; name: string; views: number; cartAdds: number; sources: Record<string, number> }[];
    byCartAdds: { id: number; name: string; views: number; cartAdds: number; sources: Record<string, number> }[];
  };
}) {
  const [view, setView] = useState<'views' | 'cart'>('views');
  const data = view === 'views' ? productData.byViews : productData.byCartAdds;

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setView('views')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${view === 'views' ? 'text-white' : 'bg-gray-100 text-gray-600'}`}
          style={view === 'views' ? { backgroundColor: PRIMARY } : undefined}
        >
          Pi&ugrave; visualizzati
        </button>
        <button
          onClick={() => setView('cart')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${view === 'cart' ? 'text-white' : 'bg-gray-100 text-gray-600'}`}
          style={view === 'cart' ? { backgroundColor: PRIMARY } : undefined}
        >
          Pi&ugrave; aggiunti al carrello
        </button>
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-gray-400">Nessun dato prodotto registrato</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-3 py-2 font-semibold text-gray-600">#</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-600">Prodotto</th>
                <th className="text-right px-3 py-2 font-semibold text-gray-600">Visualizzazioni</th>
                <th className="text-right px-3 py-2 font-semibold text-gray-600">Carrello</th>
                <th className="text-right px-3 py-2 font-semibold text-gray-600">Conv. %</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-600">Fonti</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p, i) => {
                const convRate = p.views > 0 ? (p.cartAdds / p.views) * 100 : 0;
                return (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                    <td className="px-3 py-2 font-medium text-gray-900 max-w-[200px] truncate">{p.name}</td>
                    <td className="px-3 py-2 text-right">{p.views}</td>
                    <td className="px-3 py-2 text-right">{p.cartAdds}</td>
                    <td className="px-3 py-2 text-right">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          convRate >= 20
                            ? 'bg-green-100 text-green-700'
                            : convRate >= 5
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {fmtPct(convRate)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        {Object.entries(p.sources).map(([src, count]) => (
                          <span key={src} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded">
                            {src}: {count}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
