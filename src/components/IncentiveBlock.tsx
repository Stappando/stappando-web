'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import AuthModal from '@/components/AuthModal';

export default function IncentiveBlock() {
  const { token, user } = useAuthStore();
  const isLogged = !!token && !!user;

  if (isLogged) return <LoggedBlock userId={user.id} />;
  return <GuestBlock />;
}

/* ── Guest: 5% first order ──────────────────────────────── */

function GuestBlock() {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
      <div className="bg-[#005667] rounded-xl px-6 py-7 sm:px-9 sm:py-7">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <p className="text-[11px] font-bold text-[#d9c39a] uppercase tracking-[0.08em] mb-2">
              Solo per i nuovi clienti
            </p>
            <h2 className="text-[22px] sm:text-[26px] font-semibold text-white leading-tight mb-2">
              Il tuo primo ordine con il 5% di sconto
            </h2>
            <p className="text-[14px] text-white/65 leading-relaxed">
              Registrati, ricevi il codice via mail. Valido 30 giorni.
            </p>
          </div>
          <div className="shrink-0">
            <button
              onClick={() => setAuthOpen(true)}
              className="w-full sm:w-auto bg-[#d9c39a] text-[#3D2B1A] rounded-lg px-7 py-[13px] text-[14px] font-semibold hover:bg-[#cbb48a] transition-colors"
            >
              Registrati ora
            </button>
          </div>
        </div>
      </div>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}

/* ── Logged: POP points ─────────────────────────────────── */

function LoggedBlock({ userId }: { userId: number }) {
  const [points, setPoints] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/points?userId=${userId}`)
      .then(r => r.json())
      .then(data => {
        setPoints(typeof data.points === 'number' ? data.points : 0);
      })
      .catch(() => setPoints(0))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-white border-[1.5px] border-[#d9c39a] rounded-xl px-6 py-7 sm:px-9 sm:py-7 animate-pulse">
        <div className="h-5 bg-gray-100 rounded w-1/4 mb-3" />
        <div className="h-8 bg-gray-100 rounded w-1/2 mb-2" />
        <div className="h-4 bg-gray-100 rounded w-2/3" />
      </div>
    );
  }

  const hasPoints = points !== null && points > 0;
  const euroValue = hasPoints ? (points! / 100).toFixed(2).replace('.', ',') : '0';

  return (
    <div className="bg-white border-[1.5px] border-[#d9c39a] rounded-xl px-6 py-7 sm:px-9 sm:py-7">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div>
          <p className="text-[11px] font-bold text-[#005667] uppercase tracking-[0.08em] mb-2">
            I tuoi Punti POP
          </p>
          {hasPoints ? (
            <>
              <h2 className="text-[22px] sm:text-[26px] font-semibold text-[#1a1a1a] leading-tight mb-2">
                Hai {points} Punti POP · vale €{euroValue}
              </h2>
              <p className="text-[14px] text-[#888] leading-relaxed">
                Puoi usarli subito sul tuo prossimo ordine. Non scadono mai.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-[22px] sm:text-[26px] font-semibold text-[#1a1a1a] leading-tight mb-2">
                Inizia a guadagnare Punti POP
              </h2>
              <p className="text-[14px] text-[#888] leading-relaxed">
                Ogni euro speso = 1 punto. 100 punti = €1 di sconto. Non scadono mai.
              </p>
            </>
          )}
        </div>
        <div className="shrink-0">
          <Link
            href="/cerca"
            className="inline-block w-full sm:w-auto text-center bg-[#005667] text-white rounded-lg px-7 py-[13px] text-[14px] font-semibold hover:bg-[#004555] transition-colors"
          >
            Scopri i vini →
          </Link>
        </div>
      </div>
    </div>
  );
}
