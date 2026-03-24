'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="it">
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#005667', marginBottom: '0.5rem' }}>
              Qualcosa è andato storto
            </h1>
            <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              Stiamo lavorando per risolvere il problema.
            </p>
            <button
              onClick={reset}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#005667',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Riprova
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
