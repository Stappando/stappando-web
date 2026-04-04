'use client';

import { useState, useEffect } from 'react';

/* Re-apply consent on page load if user already chose */
function restoreConsent() {
  try {
    const w = window as /* eslint-disable-line @typescript-eslint/no-explicit-any */ any;
    if (!w.gtag) return;
    const consent = localStorage.getItem('cookie_consent');
    if (consent === 'all') {
      w.gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
      });
    }
  } catch { /* noop */ }
}

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    restoreConsent();
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) setShow(true);
  }, []);

  const accept = () => {
    localStorage.setItem('cookie_consent', 'all');
    setShow(false);
    try {
      const w = window as /* eslint-disable-line @typescript-eslint/no-explicit-any */ any;
      if (w.gtag) {
        w.gtag('consent', 'update', {
          analytics_storage: 'granted',
          ad_storage: 'granted',
          ad_user_data: 'granted',
          ad_personalization: 'granted',
        });
      }
    } catch { /* noop */ }
  };

  const decline = () => {
    localStorage.setItem('cookie_consent', 'essential');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[90] p-4 animate-fadeIn">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 mb-1">Questo sito utilizza i cookie 🍪</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Utilizziamo cookie tecnici e, con il tuo consenso, cookie di profilazione per migliorare la tua esperienza.{' '}
              <a href="https://stappando.it/privacy-policy-2/" target="_blank" rel="noopener noreferrer" className="underline text-[#055667]">
                Privacy Policy
              </a>
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={decline}
              className="px-4 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Solo essenziali
            </button>
            <button
              onClick={accept}
              className="px-5 py-2 rounded-lg bg-[#055667] text-white text-xs font-semibold hover:bg-[#044556] transition-colors"
            >
              Accetta tutti
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
