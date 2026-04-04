import Link from 'next/link';

export const metadata = {
  title: 'Pagina non trovata — Stappando',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold text-[#005667] mb-4">404</p>
        <h1 className="text-xl font-bold text-[#1a1a1a] mb-2">Pagina non trovata</h1>
        <p className="text-sm text-gray-500 mb-8">
          La pagina che cerchi non esiste o potrebbe essere stata spostata.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-[#005667] text-white font-semibold rounded-xl hover:bg-[#004555] transition-colors text-sm"
          >
            Torna alla home
          </Link>
          <Link
            href="/cerca"
            className="px-6 py-3 bg-white border border-gray-200 text-[#1a1a1a] font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm"
          >
            Cerca vini
          </Link>
        </div>
        <div className="mt-8 flex justify-center gap-6 text-sm text-[#005667]">
          <Link href="/cantine" className="hover:underline">Cantine</Link>
          <Link href="/blog" className="hover:underline">Blog</Link>
          <Link href="/contatti" className="hover:underline">Contatti</Link>
        </div>
      </div>
    </div>
  );
}
