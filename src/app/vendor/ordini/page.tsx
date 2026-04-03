'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import Link from 'next/link';

/* ── Types ─────────────────────────────────────────────── */

interface OrderItem {
  id: number;
  product_id: number;
  name: string;
  quantity: number;
  price: string;
  total: string;
  image: string;
}

interface VendorOrder {
  id: number;
  display_number?: string;
  parent_order_id: number;
  status: string;
  date_created: string;
  total: string;
  currency: string;
  customer_name: string;
  customer_email: string;
  shipping: {
    first_name: string;
    last_name: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  vendor_name: string;
  items: OrderItem[];
  commission: {
    gross: string;
    platform_fee: string;
    net: string;
    vendor_rate: string;
  };
}

/* ── Status helpers ───────────────────────────────────── */

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  processing: { label: 'Da preparare', color: '#92400e', bg: '#fef3c7' },
  completed: { label: 'Spedito', color: '#065f46', bg: '#d1fae5' },
  'on-hold': { label: 'In attesa', color: '#6b7280', bg: '#f3f4f6' },
  pending: { label: 'In attesa pagamento', color: '#6b7280', bg: '#f3f4f6' },
  cancelled: { label: 'Annullato', color: '#991b1b', bg: '#fee2e2' },
  refunded: { label: 'Rimborsato', color: '#991b1b', bg: '#fee2e2' },
};

function statusBadge(status: string) {
  const s = STATUS_MAP[status] || { label: status, color: '#6b7280', bg: '#f3f4f6' };
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ color: s.color, backgroundColor: s.bg }}
    >
      {s.label}
    </span>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function formatCurrency(amount: string) {
  const n = parseFloat(amount);
  if (isNaN(n)) return amount;
  return n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
}

/* ── Page component ───────────────────────────────────── */

export default function VendorOrdiniPage() {
  const { user, isAuthenticated, isVendor } = useAuthStore();
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setHydrated(true); }, []);

  useEffect(() => {
    if (!hydrated || !user?.id) return;
    setLoading(true);
    fetch(`/api/vendor/orders?vendorId=${user.id}`)
      .then((r) => {
        if (!r.ok) throw new Error('Errore nel caricamento ordini');
        return r.json();
      })
      .then((data: VendorOrder[]) => {
        setOrders(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [hydrated, user?.id]);

  /* ── Guards ── */

  if (!hydrated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#005667] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated()) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="text-[22px] font-bold text-[#1a1a1a] mb-3">Accesso riservato</h1>
        <p className="text-[14px] text-[#888] mb-6">Questa area è riservata ai venditori registrati.</p>
        <Link href="/" className="inline-block bg-[#005667] text-white rounded-lg px-6 py-3 text-[14px] font-semibold hover:bg-[#004555]">
          Torna alla homepage
        </Link>
      </div>
    );
  }

  const isVendorCheck = isVendor() || (typeof window !== 'undefined' && localStorage.getItem('stappando-is-vendor') === 'true');
  if (!isVendorCheck) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="text-[22px] font-bold text-[#1a1a1a] mb-3">Area venditori</h1>
        <p className="text-[14px] text-[#888] mb-6">Il tuo account non è registrato come venditore.</p>
        <Link href="/account" className="inline-block bg-[#005667] text-white rounded-lg px-6 py-3 text-[14px] font-semibold hover:bg-[#004555]">
          Vai al tuo account
        </Link>
      </div>
    );
  }

  /* ── Render ── */

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#1a1a1a]">Ordini ricevuti</h1>
          <p className="text-[13px] text-[#888] mt-0.5">I sub-ordini assegnati alla tua cantina</p>
        </div>
        <Link
          href="/vendor/dashboard"
          className="text-[13px] text-[#005667] font-medium hover:underline"
        >
          &larr; Dashboard
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#005667] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-[13px] text-red-700 mb-6">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && orders.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-[#f8f6f1] flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#ccc]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <p className="text-[15px] font-semibold text-[#1a1a1a] mb-1">Nessun ordine ricevuto ancora</p>
          <p className="text-[13px] text-[#888]">Quando un cliente acquista i tuoi prodotti, vedrai gli ordini qui.</p>
        </div>
      )}

      {/* Orders list */}
      {!loading && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => {
            const shippingAddr = [
              order.shipping.address_1,
              order.shipping.address_2,
              `${order.shipping.postcode} ${order.shipping.city}`,
              order.shipping.state,
            ]
              .filter(Boolean)
              .join(', ');

            return (
              <div
                key={order.id}
                className="bg-white border border-[#e8e4dc] rounded-xl p-5 hover:border-[#005667]/30 transition-colors"
              >
                {/* Top row: ID + date + status */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-bold text-[#1a1a1a]">#{order.display_number || order.id}</span>
                    <span className="text-[12px] text-[#888]">{formatDate(order.date_created)}</span>
                  </div>
                  {statusBadge(order.status)}
                </div>

                {/* Customer info */}
                <div className="mb-3">
                  <p className="text-[13px] font-medium text-[#1a1a1a]">{order.customer_name}</p>
                  {shippingAddr && (
                    <p className="text-[12px] text-[#888] mt-0.5">{shippingAddr}</p>
                  )}
                </div>

                {/* Products */}
                <div className="border-t border-[#f0ece4] pt-3 mb-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] text-[#1a1a1a]">{item.name}</span>
                        <span className="text-[11px] text-[#888]">x{item.quantity}</span>
                      </div>
                      <span className="text-[13px] text-[#1a1a1a] font-medium">{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                </div>

                {/* Commission breakdown */}
                <div className="bg-[#f8f6f1] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-[#888] uppercase tracking-wider">Lordo</span>
                    <span className="text-[13px] text-[#1a1a1a]">{formatCurrency(order.commission.gross)}</span>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-[#888] uppercase tracking-wider">Fee piattaforma (15%)</span>
                    <span className="text-[13px] text-[#888]">-{formatCurrency(order.commission.platform_fee)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-[#e8e4dc]">
                    <span className="text-[11px] text-[#005667] uppercase tracking-wider font-semibold">
                      Tua quota ({order.commission.vendor_rate})
                    </span>
                    <span className="text-[15px] text-[#005667] font-bold">{formatCurrency(order.commission.net)}</span>
                  </div>
                </div>

                {/* Parent order ref */}
                <p className="text-[11px] text-[#aaa] mt-2">
                  Ordine principale: #{order.parent_order_id}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
