'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import Link from 'next/link';

interface VendorProduct {
  id: number;
  name: string;
  status: string;
  price: string;
  sale_price: string;
  stock_quantity: number | null;
  images: { src: string }[];
  categories: { name: string }[];
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  publish: { label: 'Attivo', color: '#065f46', bg: '#d1fae5' },
  draft: { label: 'Bozza', color: '#6b7280', bg: '#f3f4f6' },
  pending: { label: 'In revisione', color: '#92400e', bg: '#fef3c7' },
  private: { label: 'Privato', color: '#6b7280', bg: '#f3f4f6' },
};

export default function VendorProdottiPage() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setHydrated(true); }, []);

  useEffect(() => {
    if (!hydrated || !user?.id) return;
    fetch(`/api/vendor/products?vendorId=${user.id}`)
      .then(r => r.ok ? r.json() : [])
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [hydrated, user?.id]);

  if (!hydrated) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#1a1a1a]">I miei prodotti</h1>
          <p className="text-[13px] text-[#888] mt-0.5">{products.length} prodott{products.length === 1 ? 'o' : 'i'} nel catalogo</p>
        </div>
        <Link
          href="/vendor/prodotti/nuovo"
          className="bg-[#005667] text-white rounded-lg px-5 py-2.5 text-[13px] font-semibold hover:bg-[#004555] transition-colors"
        >
          + Aggiungi vino
        </Link>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#005667] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="text-center py-20 bg-white border border-[#e8e4dc] rounded-xl">
          <div className="w-16 h-16 rounded-full bg-[#f8f6f1] flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#ccc]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
            </svg>
          </div>
          <p className="text-[15px] font-semibold text-[#1a1a1a] mb-1">Nessun prodotto ancora</p>
          <p className="text-[13px] text-[#888] mb-6">Aggiungi il tuo primo vino al catalogo Stappando.</p>
          <Link
            href="/vendor/prodotti/nuovo"
            className="inline-block bg-[#005667] text-white rounded-lg px-6 py-3 text-[14px] font-semibold hover:bg-[#004555] transition-colors"
          >
            Aggiungi il tuo primo vino
          </Link>
        </div>
      )}

      {!loading && products.length > 0 && (
        <div className="space-y-3">
          {products.map(p => {
            const s = STATUS_MAP[p.status] || { label: p.status, color: '#6b7280', bg: '#f3f4f6' };
            const img = p.images?.[0]?.src;
            return (
              <div key={p.id} className="bg-white border border-[#e8e4dc] rounded-xl p-4 flex items-center gap-4 hover:border-[#005667]/30 transition-colors">
                <div className="w-14 h-14 rounded-lg bg-[#f8f6f1] flex items-center justify-center shrink-0 overflow-hidden">
                  {img ? (
                    <img src={img} alt={p.name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <svg className="w-6 h-6 text-[#ccc]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#1a1a1a] truncate">{p.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {p.categories?.[0] && <span className="text-[11px] text-[#888]">{p.categories[0].name}</span>}
                    <span className="text-[11px] text-[#888]">·</span>
                    <span className="text-[11px] text-[#888]">Stock: {p.stock_quantity ?? '∞'}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[15px] font-bold text-[#005667]">
                    {p.sale_price ? (
                      <>
                        <span className="text-[12px] text-[#aaa] line-through mr-1">{p.price}€</span>
                        {p.sale_price}€
                      </>
                    ) : (
                      `${p.price}€`
                    )}
                  </p>
                  <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold mt-1" style={{ color: s.color, backgroundColor: s.bg }}>
                    {s.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
