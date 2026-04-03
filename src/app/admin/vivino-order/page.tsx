'use client';

import { useState } from 'react';

/* ── Constants ─────────────────────────────────────────── */

const ADMIN_PASSWORD = 'stappando2026';

interface ParsedOrder {
  vivinoOrderId: string;
  customerName: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  province: string;
  zip: string;
  phone: string;
  productName: string;
  quantity: number;
  total: number;
}

interface MatchedProduct {
  productId: number;
  wcName: string;
  price: string;
  image: string | null;
  producer: string;
}

/* ── Email parser ──────────────────────────────────────── */

function parseVivinoEmail(text: string): ParsedOrder | null {
  try {
    // Order ID: "N. ordine: X1I14F5Q"
    const orderIdMatch = text.match(/N\.\s*ordine:\s*(\S+)/i);
    const vivinoOrderId = orderIdMatch?.[1] || '';

    // Customer name: first line after "Indirizzo di spedizione:" (skip empty)
    const addrBlock = text.split(/Indirizzo di spedizione:/i)[1];
    if (!addrBlock) return null;

    const addrLines = addrBlock
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    // Line 0: customer name, Line 1: street, Line 2: city+province+zip, Line 3: phone
    const customerName = addrLines[0] || '';
    const nameParts = customerName.split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const address = addrLines[1] || '';

    // Parse "Milano mi 20141" or "Roma RM 00100" — city, province(2 chars), zip(5 digits)
    const cityLine = addrLines[2] || '';
    const zipMatch = cityLine.match(/(\d{5})/);
    const zip = zipMatch?.[1] || '';
    // Province: 2-letter code (case insensitive), usually before or after the zip
    const provMatch = cityLine.match(/\b([a-zA-Z]{2})\b(?=\s*\d{5})|(?:\d{5}\s*)([a-zA-Z]{2})\b/);
    const province = (provMatch?.[1] || provMatch?.[2] || '').toUpperCase();
    // City: everything that isn't the zip or the province
    const city = cityLine
      .replace(/\d{5}/, '')
      .replace(new RegExp(`\\b${province}\\b`, 'i'), '')
      .trim()
      .replace(/,\s*$/, '');

    // Phone: line starting with + or containing digits with spaces
    const phoneLine = addrLines.find(l => /^\+?\d[\d\s-]{6,}/.test(l));
    const phone = phoneLine?.trim() || '';

    // Product: "N bottiglia" for quantity
    const qtyMatch = text.match(/(\d+)\s*bottigli[ae]/i);
    const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;

    // Product name: line after the quantity line in "Riepilogo" or "Dettagli" section
    // Pattern: Producer name on one line, then wine name on the next, then Bottle info
    const detailBlock = text.split(/Dettagli/i)[1] || text.split(/Riepilogo del suo ordine/i)[1] || '';
    const detailLines = detailBlock
      .split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.match(/^\d+\s*bottigli/i) && !l.match(/^Bottle/i) && !l.match(/^€/) && !l.match(/^Totale/i) && !l.match(/^Spedizione/i) && !l.match(/Tax/i) && !l.match(/Beverage/i) && !l.match(/^\|/) && !l.match(/^Gratis/i));

    // Usually: first line is producer, second is wine name
    // Combine the first meaningful lines as product name for search
    const productParts: string[] = [];
    for (const line of detailLines) {
      if (productParts.length >= 2) break;
      if (line.length > 2 && !line.startsWith('N.') && !line.startsWith('Ordine')) {
        productParts.push(line);
      }
    }
    const productName = productParts.join(' ').trim();

    // Total: "Totale ordine: €149.40"
    const totalMatch = text.match(/Totale ordine:\s*€([\d.,]+)/i);
    const total = totalMatch ? parseFloat(totalMatch[1].replace(',', '.')) : 0;

    if (!vivinoOrderId) return null;

    return {
      vivinoOrderId,
      customerName,
      firstName,
      lastName,
      address,
      city,
      province,
      zip,
      phone,
      productName,
      quantity,
      total,
    };
  } catch {
    return null;
  }
}

/* ── Page Component ────────────────────────────────────── */

export default function AdminVivinoOrderPage() {
  const [emailText, setEmailText] = useState('');
  const [parsed, setParsed] = useState<ParsedOrder | null>(null);
  const [parseError, setParseError] = useState('');
  const [matchedProduct, setMatchedProduct] = useState<MatchedProduct | null>(null);
  const [matching, setMatching] = useState(false);
  const [matchError, setMatchError] = useState('');
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  /* ── Step 1: Parse email ─────────────────────────────── */

  const handleParse = async () => {
    setParseError('');
    setMatchedProduct(null);
    setMatchError('');
    setResult(null);

    const data = parseVivinoEmail(emailText);
    if (!data) {
      setParseError('Impossibile estrarre i dati dall\'email. Verifica il formato.');
      setParsed(null);
      return;
    }
    setParsed(data);

    // Auto-search for matching WC product
    if (data.productName) {
      setMatching(true);
      try {
        // Search with producer name (first part of productName)
        const searchTerm = data.productName.split(' ').slice(0, 3).join(' ');
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}&per_page=5`);
        if (res.ok) {
          const results = await res.json();
          const list = Array.isArray(results) ? results : results.results || [];
          if (list.length > 0) {
            setMatchedProduct({
              productId: list[0].id,
              wcName: list[0].name,
              price: list[0].price,
              image: list[0].image,
              producer: list[0].producer,
            });
          } else {
            setMatchError(`Nessun prodotto trovato per "${searchTerm}". Prova a cercarlo manualmente.`);
          }
        }
      } catch { /* ignore */ }
      setMatching(false);
    }
  };

  /* ── Manual product search ───────────────────────────── */

  const [manualSearch, setManualSearch] = useState('');
  const [manualResults, setManualResults] = useState<MatchedProduct[]>([]);
  const [manualSearching, setManualSearching] = useState(false);

  const searchManual = async () => {
    if (!manualSearch.trim()) return;
    setManualSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(manualSearch.trim())}&per_page=8`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.results || [];
        setManualResults(list.map((p: { id: number; name: string; price: string; image: string | null; producer: string }) => ({
          productId: p.id,
          wcName: p.name,
          price: p.price,
          image: p.image,
          producer: p.producer,
        })));
      }
    } catch { /* ignore */ }
    setManualSearching(false);
  };

  /* ── Step 2: Create order ────────────────────────────── */

  const handleCreate = async () => {
    if (!parsed || !matchedProduct) return;
    setCreating(true);
    setResult(null);

    try {
      const res = await fetch('/api/vivino/incoming-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': ADMIN_PASSWORD,
        },
        body: JSON.stringify({
          vivinoOrderId: parsed.vivinoOrderId,
          customer: {
            firstName: parsed.firstName,
            lastName: parsed.lastName,
            email: '', // Vivino doesn't share customer email
            phone: parsed.phone,
            address: parsed.address,
            city: parsed.city,
            province: parsed.province,
            zip: parsed.zip,
          },
          items: [{
            productId: matchedProduct.productId,
            name: matchedProduct.wcName,
            price: parseFloat(matchedProduct.price) || 0,
            quantity: parsed.quantity,
          }],
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResult({ success: true, message: `Ordine WC #${data.orderId} creato! Split sub-ordini in corso.` });
        setEmailText('');
        setParsed(null);
        setMatchedProduct(null);
      } else {
        setResult({ success: false, message: data.error || 'Errore sconosciuto' });
      }
    } catch (err) {
      setResult({ success: false, message: err instanceof Error ? err.message : 'Errore di rete' });
    }
    setCreating(false);
  };

  /* ── Render ──────────────────────────────────────────── */

  const labelClass = 'block text-[11px] font-semibold text-[#888] uppercase tracking-wider mb-0.5';

  return (
    <div className="min-h-screen bg-[#faf9f6] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#7e1a2a' }}>
            <span className="text-white text-[14px] font-bold">V</span>
          </div>
          <div>
            <h1 className="text-[20px] font-bold text-[#1a1a1a]">Ordine Vivino</h1>
            <p className="text-[12px] text-[#888]">Incolla l&apos;email di notifica Vivino &rarr; parsing automatico &rarr; un click</p>
          </div>
        </div>

        {/* Result banner */}
        {result && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-[13px] font-medium ${result.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {result.message}
          </div>
        )}

        {/* Step 1: Paste email */}
        <div className="bg-white border border-[#e8e4dc] rounded-xl p-5 mb-4">
          <h2 className="text-[14px] font-bold text-[#1a1a1a] mb-2">1. Incolla l&apos;email Vivino</h2>
          <p className="text-[11px] text-[#888] mb-3">Copia tutto il testo dell&apos;email &quot;Hai ricevuto un nuovo ordine!&quot; e incollalo qui sotto.</p>
          <textarea
            value={emailText}
            onChange={e => { setEmailText(e.target.value); setParsed(null); setMatchedProduct(null); setResult(null); }}
            placeholder={'Incolla qui il testo dell\'email Vivino...\n\nEs: Hai ricevuto un nuovo ordine!\nN. ordine: X1I14F5Q\n...'}
            rows={8}
            className="w-full px-3 py-2 text-[12px] border border-[#e8e4dc] rounded-lg focus:outline-none focus:border-[#005667] text-[#333] placeholder:text-[#bbb] resize-none font-mono"
          />
          {parseError && <p className="text-[12px] text-red-600 mt-2">{parseError}</p>}
          <button
            type="button"
            onClick={handleParse}
            disabled={!emailText.trim()}
            className="mt-3 px-5 py-2 text-[13px] font-semibold text-white rounded-lg transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#005667' }}
          >
            Analizza email
          </button>
        </div>

        {/* Step 2: Parsed data review */}
        {parsed && (
          <div className="bg-white border border-[#e8e4dc] rounded-xl p-5 mb-4">
            <h2 className="text-[14px] font-bold text-[#1a1a1a] mb-3">2. Dati estratti</h2>

            <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-4">
              <div>
                <span className={labelClass}>Ordine Vivino</span>
                <p className="text-[13px] font-bold text-[#7e1a2a]">{parsed.vivinoOrderId}</p>
              </div>
              <div>
                <span className={labelClass}>Totale</span>
                <p className="text-[13px] font-semibold">&euro;{parsed.total.toFixed(2)}</p>
              </div>
              <div>
                <span className={labelClass}>Cliente</span>
                <p className="text-[13px]">{parsed.customerName}</p>
              </div>
              <div>
                <span className={labelClass}>Telefono</span>
                <p className="text-[13px]">{parsed.phone || '—'}</p>
              </div>
              <div className="col-span-2">
                <span className={labelClass}>Indirizzo</span>
                <p className="text-[13px]">{parsed.address}, {parsed.zip} {parsed.city} ({parsed.province})</p>
              </div>
            </div>

            <div className="border-t border-[#f0ece4] pt-3">
              <span className={labelClass}>Prodotto Vivino</span>
              <p className="text-[13px]">{parsed.productName} <span className="text-[#888]">x{parsed.quantity}</span></p>
            </div>

            {/* Matched WC product */}
            <div className="mt-4 border-t border-[#f0ece4] pt-3">
              <span className={labelClass}>Prodotto WooCommerce abbinato</span>
              {matching && <p className="text-[12px] text-[#888] mt-1">Ricerca in corso...</p>}
              {matchError && <p className="text-[12px] text-orange-600 mt-1">{matchError}</p>}
              {matchedProduct && (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mt-1">
                  {matchedProduct.image && <img src={matchedProduct.image} alt="" className="w-10 h-10 rounded-md object-cover" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-green-800 truncate">{matchedProduct.wcName}</p>
                    <p className="text-[10px] text-green-600">{matchedProduct.producer} &middot; {matchedProduct.price} &euro;</p>
                  </div>
                  <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Match</span>
                </div>
              )}

              {/* Manual search fallback */}
              <div className="mt-3">
                <p className="text-[11px] text-[#888] mb-1">Prodotto sbagliato? Cerca manualmente:</p>
                <div className="flex gap-2">
                  <input
                    value={manualSearch}
                    onChange={e => setManualSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchManual()}
                    placeholder="Cerca prodotto..."
                    className="flex-1 px-3 py-1.5 text-[12px] border border-[#e8e4dc] rounded-lg focus:outline-none focus:border-[#005667] text-[#333]"
                  />
                  <button type="button" onClick={searchManual} disabled={manualSearching} className="px-3 py-1.5 text-[11px] font-semibold text-white rounded-lg" style={{ backgroundColor: '#005667' }}>
                    {manualSearching ? '...' : 'Cerca'}
                  </button>
                </div>
                {manualResults.length > 0 && (
                  <div className="border border-[#e8e4dc] rounded-lg mt-2 max-h-40 overflow-y-auto">
                    {manualResults.map(p => (
                      <button
                        key={p.productId}
                        type="button"
                        onClick={() => { setMatchedProduct(p); setManualResults([]); setMatchError(''); }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[#f8f6f1] transition-colors border-b border-[#f0ece4] last:border-b-0"
                      >
                        {p.image && <img src={p.image} alt="" className="w-8 h-8 rounded-md object-cover" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-[#1a1a1a] truncate">{p.wcName}</p>
                          <p className="text-[10px] text-[#888]">{p.producer} &middot; {p.price} &euro;</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Create */}
        {parsed && matchedProduct && (
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="w-full py-3 rounded-xl text-[14px] font-bold text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#7e1a2a' }}
          >
            {creating ? 'Creazione in corso...' : `Crea ordine WC — ${parsed.vivinoOrderId}`}
          </button>
        )}
      </div>
    </div>
  );
}
