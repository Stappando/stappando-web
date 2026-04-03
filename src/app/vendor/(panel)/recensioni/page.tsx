'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';

interface Review {
  id: number;
  product_name: string;
  reviewer: string;
  rating: number;
  review: string;
  date_created: string;
}

export default function VendorRecensioniPage() {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setHydrated(true); }, []);

  useEffect(() => {
    if (!hydrated || !user?.id) return;
    fetch(`/api/vendor/reviews?vendorId=${user.id}`)
      .then(r => r.ok ? r.json() : [])
      .then(setReviews)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [hydrated, user?.id]);

  if (!hydrated) return null;

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '—';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#1a1a1a]">Recensioni ricevute</h1>
          <p className="text-[13px] text-[#888] mt-0.5">{reviews.length} recension{reviews.length === 1 ? 'e' : 'i'} · Media {avgRating}/5</p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#005667] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && reviews.length === 0 && (
        <div className="text-center py-20 bg-white border border-[#e8e4dc] rounded-xl">
          <div className="w-16 h-16 rounded-full bg-[#f8f6f1] flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#ccc]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          </div>
          <p className="text-[15px] font-semibold text-[#1a1a1a] mb-1">Nessuna recensione ancora</p>
          <p className="text-[13px] text-[#888]">Le recensioni dei clienti appariranno qui.</p>
        </div>
      )}

      {!loading && reviews.length > 0 && (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className="bg-white border border-[#e8e4dc] rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-[14px] font-semibold text-[#1a1a1a]">{r.product_name}</p>
                  <p className="text-[12px] text-[#888]">{r.reviewer} · {new Date(r.date_created).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <svg key={s} className={`w-4 h-4 ${s <= r.rating ? 'text-[#d9c39a]' : 'text-[#e8e4dc]'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              {r.review && <p className="text-[13px] text-[#666] leading-relaxed" dangerouslySetInnerHTML={{ __html: r.review }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
