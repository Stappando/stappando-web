'use client';

import { useEffect, useState } from 'react';
import { useAuthStore, useStoreHydrated } from '@/store/auth';
import Link from 'next/link';


interface DashboardStats {
  ordersThisMonth: number;
  revenueNet: number;
  productsActive: number;
  avgRating: number;
}

export default function VendorDashboard() {
  const user = useAuthStore(s => s.user);
  const hydrated = useStoreHydrated();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Fetch basic stats
  useEffect(() => {
    if (!hydrated || !user?.id) return;
    fetch(`/api/vendor/orders?vendorId=${user.id}`)
      .then(r => r.ok ? r.json() : [])
      .then((orders: { date_created: string; commission: { net: string } }[]) => {
        const now = new Date();
        const thisMonth = orders.filter(o => {
          const d = new Date(o.date_created);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        setStats({
          ordersThisMonth: thisMonth.length,
          revenueNet: thisMonth.reduce((sum, o) => sum + parseFloat(o.commission?.net || '0'), 0),
          productsActive: 0,
          avgRating: 0,
        });
      })
      .catch(() => {});
  }, [hydrated, user?.id]);

  if (!hydrated) {
    return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#005667] border-t-transparent rounded-full animate-spin" /></div>;
  }

  // Layout handles auth, vendor role, and status guards — if we're here, vendor is approved
  const formatEur = (n: number) => n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });

  const statCards = [
    { label: 'Ordini questo mese', value: stats ? String(stats.ordersThisMonth) : '—', icon: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z' },
    { label: 'Fatturato netto', value: stats ? formatEur(stats.revenueNet) : '—', icon: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z' },
    { label: 'Prodotti attivi', value: stats ? String(stats.productsActive) : '—', icon: 'M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z' },
    { label: 'Media recensioni', value: stats?.avgRating ? `${stats.avgRating.toFixed(1)}/5` : '—', icon: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-[#1a1a1a]">Dashboard Cantina</h1>
        <p className="text-[14px] text-[#888] mt-1">Benvenuto, {user?.firstName || 'Cantina'}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(card => (
          <div key={card.label} className="bg-white border border-[#e8e4dc] rounded-xl p-5">
            <svg className="w-6 h-6 text-[#005667] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={card.icon} /></svg>
            <p className="text-[24px] font-bold text-[#1a1a1a]">{card.value}</p>
            <p className="text-[12px] text-[#888]">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link href="/vendor/ordini" className="bg-white border border-[#e8e4dc] rounded-xl p-5 hover:border-[#005667] transition-colors block">
          <p className="text-[15px] font-semibold text-[#1a1a1a]">Ordini ricevuti</p>
          <p className="text-[12px] text-[#888]">Vedi e gestisci i tuoi ordini</p>
        </Link>
        <Link href="/vendor/prodotti" className="bg-white border border-[#e8e4dc] rounded-xl p-5 hover:border-[#005667] transition-colors block">
          <p className="text-[15px] font-semibold text-[#1a1a1a]">I miei prodotti</p>
          <p className="text-[12px] text-[#888]">Gestisci il tuo catalogo</p>
        </Link>
        <Link href="/vendor/profilo" className="bg-white border border-[#e8e4dc] rounded-xl p-5 hover:border-[#005667] transition-colors block">
          <p className="text-[15px] font-semibold text-[#1a1a1a]">Profilo cantina</p>
          <p className="text-[12px] text-[#888]">Modifica i tuoi dati</p>
        </Link>
      </div>

      <div className="bg-white border border-[#e8e4dc] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-semibold text-[#1a1a1a]">Ultimi ordini</h2>
          <Link href="/vendor/ordini" className="text-[12px] text-[#005667] font-medium hover:underline">Vedi tutti →</Link>
        </div>
        <p className="text-[13px] text-[#888]">Gli ordini appariranno qui quando i clienti acquisteranno i tuoi prodotti.</p>
      </div>
    </div>
  );
}
