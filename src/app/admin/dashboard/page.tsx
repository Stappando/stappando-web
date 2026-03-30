'use client';

import Link from 'next/link';

const ADMIN_PASSWORD = 'stappando2026';
const AUTO = `?auto=${ADMIN_PASSWORD}`;

const tools = [
  { icon: '📊', title: 'Statistiche', desc: 'Ricerche, conversioni, flusso utente', href: `/admin/analytics` },
  { icon: '✉️', title: 'Email Preview', desc: 'Anteprima template mail', href: `/admin/email-preview` },
  { icon: '🤝', title: 'CRM Fiere', desc: 'Inserisci contatti e invia presentazione', href: `/admin/fiere` },
  { icon: '🛒', title: 'WooCommerce', desc: 'Ordini, prodotti, clienti', href: 'https://stappando.it/wp-admin/edit.php?post_type=shop_order', external: true },
  { icon: '📦', title: 'Prodotti', desc: 'Gestisci catalogo vini', href: 'https://stappando.it/wp-admin/edit.php?post_type=product', external: true },
  { icon: '📝', title: 'Bozze Vendor', desc: 'Prodotti in attesa di approvazione', href: 'https://stappando.it/wp-admin/edit.php?post_type=product&post_status=draft', external: true },
  { icon: '👥', title: 'Clienti', desc: 'Lista clienti WooCommerce', href: 'https://stappando.it/wp-admin/admin.php?page=wc-admin&path=%2Fcustomers', external: true },
  { icon: '🏪', title: 'Shop Live', desc: 'Vai al sito pubblico', href: 'https://shop.stappando.it', external: true },
];

const quickLinks = [
  { label: 'Best seller', href: 'https://shop.stappando.it/cerca?tag=best-seller' },
  { label: 'Offerte', href: 'https://shop.stappando.it/cerca?on_sale=true' },
  { label: 'Cantine', href: 'https://shop.stappando.it/cantine' },
  { label: 'Stripe Dashboard', href: 'https://dashboard.stripe.com' },
  { label: 'Mandrill', href: 'https://mandrillapp.com' },
  { label: 'Vercel', href: 'https://vercel.com/stappando/stappando-web' },
  { label: 'ShippyPro', href: 'https://app.shippypro.com' },
  { label: 'Google Sheets CRM', href: 'https://docs.google.com/spreadsheets/d/1sjxo95pOQz76jizopNgjMiHc3A0u1mnhbROuTxAQ948' },
];

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-[#f8f7f5]">
      {/* Header */}
      <header className="bg-[#005667] text-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold">🍷 Stappando Admin</h1>
          <p className="text-white/70 text-sm mt-1">Dashboard di gestione</p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Tools Grid */}
        <h2 className="text-lg font-bold text-[#005667] mb-4">Strumenti</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {tools.map((t) => (
            <a
              key={t.title}
              href={t.href}
              target={('external' in t && t.external) ? '_blank' : undefined}
              rel={('external' in t && t.external) ? 'noopener noreferrer' : undefined}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-[#005667]/20 transition-all group"
            >
              <span className="text-2xl block mb-2">{t.icon}</span>
              <h3 className="font-semibold text-[#005667] group-hover:underline">{t.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{t.desc}</p>
            </a>
          ))}
        </div>

        {/* Quick Links */}
        <h2 className="text-lg font-bold text-[#005667] mb-4">Link rapidi</h2>
        <div className="flex flex-wrap gap-2 mb-10">
          {quickLinks.map((l) => (
            <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white rounded-lg border border-gray-200 text-sm text-gray-700 hover:border-[#005667] hover:text-[#005667] transition-colors">
              {l.label} ↗
            </a>
          ))}
        </div>

        {/* Status */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-[#005667] mb-3">Stato sistema</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-1" />
              <p className="text-xs font-semibold text-gray-700">Shop</p>
              <p className="text-[10px] text-gray-400">shop.stappando.it</p>
            </div>
            <div>
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-1" />
              <p className="text-xs font-semibold text-gray-700">WooCommerce</p>
              <p className="text-[10px] text-gray-400">stappando.it</p>
            </div>
            <div>
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-1" />
              <p className="text-xs font-semibold text-gray-700">Stripe</p>
              <p className="text-[10px] text-gray-400">Pagamenti attivi</p>
            </div>
            <div>
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-1" />
              <p className="text-xs font-semibold text-gray-700">Mandrill</p>
              <p className="text-[10px] text-gray-400">Email attive</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
