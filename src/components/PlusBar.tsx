'use client';

import { useState } from 'react';
import Link from 'next/link';
import AuthModal from './AuthModal';

export default function PlusBar() {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
      <section className="mt-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div className="bg-white rounded-xl p-3 border border-gray-100 flex items-start gap-2.5">
            <svg className="w-5 h-5 text-[#055667] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div>
              <p className="text-[11px] font-bold text-gray-900 leading-tight">Sconto primi due ordini</p>
              <button onClick={() => setAuthOpen(true)} className="text-[10px] text-[#055667] font-semibold hover:underline">Iscriviti →</button>
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100 flex items-start gap-2.5">
            <svg className="w-5 h-5 text-[#055667] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            <p className="text-[11px] font-bold text-gray-900 leading-tight">Consegna gratuita da €69, in 24/48h</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100 flex items-start gap-2.5">
            <svg className="w-5 h-5 text-[#055667] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            <p className="text-[11px] font-bold text-gray-900 leading-tight">Imballi omologati anti-danno</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100 flex items-start gap-2.5">
            <svg className="w-5 h-5 text-[#055667] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            <p className="text-[11px] font-bold text-gray-900 leading-tight">PayPal, carta, rate, bonifico, contanti</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100 flex items-start gap-2.5">
            <svg className="w-5 h-5 text-[#b8973f] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
            <div>
              <p className="text-[11px] font-bold text-gray-900 leading-tight">Accumuli Punti POP e risparmi</p>
              <Link href="/punti-pop" className="text-[10px] text-[#b8973f] font-semibold hover:underline">Scopri come →</Link>
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100 flex items-start gap-2.5">
            <svg className="w-5 h-5 text-[#055667] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
            <p className="text-[11px] font-bold text-gray-900 leading-tight">Monitora consegna in tempo reale</p>
          </div>
        </div>
      </section>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
