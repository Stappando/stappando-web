'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import { useCartStore } from '@/store/cart';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY || '');

type Status = 'loading' | 'succeeded' | 'processing' | 'failed';

export default function ConfirmationPage() {
  const [status, setStatus] = useState<Status>('loading');
  const clearCart = useCartStore((s) => s.clearCart);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const provider = params.get('provider');

    // PayPal — status comes from URL params (set by server redirect)
    if (provider === 'paypal') {
      const urlStatus = params.get('status');
      if (urlStatus === 'succeeded') {
        setStatus('succeeded');
        clearCart();
      } else if (urlStatus === 'processing' || urlStatus === 'pending') {
        setStatus('processing');
        clearCart();
      } else {
        setStatus('failed');
      }
      return;
    }

    // Stripe — verify via client secret
    const clientSecret = params.get('payment_intent_client_secret');
    if (!clientSecret) {
      setStatus('failed');
      return;
    }

    stripePromise.then(async (stripe) => {
      if (!stripe) { setStatus('failed'); return; }

      const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);
      switch (paymentIntent?.status) {
        case 'succeeded':
          setStatus('succeeded');
          clearCart();
          break;
        case 'processing':
          setStatus('processing');
          clearCart();
          break;
        default:
          setStatus('failed');
      }
    });
  }, [clearCart]);

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      {status === 'loading' && (
        <div className="flex flex-col items-center gap-4">
          <svg className="w-10 h-10 animate-spin text-brand-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-brand-muted">Verifica pagamento in corso...</p>
        </div>
      )}

      {status === 'succeeded' && (
        <>
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-brand-text mb-2">Ordine confermato!</h1>
          <p className="text-brand-muted mb-8">
            Grazie per il tuo acquisto. Riceverai una email di conferma a breve.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary text-white font-semibold rounded-xl hover:bg-brand-primary/90 transition-colors"
          >
            Torna alla homepage
          </Link>
        </>
      )}

      {status === 'processing' && (
        <>
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-yellow-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-brand-text mb-2">Pagamento in elaborazione</h1>
          <p className="text-brand-muted mb-8">
            Il pagamento è in fase di conferma. Ti invieremo una email non appena completato.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary text-white font-semibold rounded-xl hover:bg-brand-primary/90 transition-colors"
          >
            Torna alla homepage
          </Link>
        </>
      )}

      {status === 'failed' && (
        <>
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-brand-text mb-2">Pagamento non riuscito</h1>
          <p className="text-brand-muted mb-8">
            Si è verificato un problema con il pagamento. Riprova o contattaci.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/checkout"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary text-white font-semibold rounded-xl hover:bg-brand-primary/90 transition-colors"
            >
              Riprova
            </Link>
            <Link
              href="/contatti"
              className="inline-flex items-center gap-2 px-6 py-3 border border-brand-border text-brand-text font-semibold rounded-xl hover:bg-brand-bg transition-colors"
            >
              Contattaci
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
