import { NextRequest, NextResponse } from 'next/server';
import { getWCSecrets } from '@/lib/config';
import { sanitize } from '@/lib/validation';
import { sendEmail } from '@/lib/mail/mandrill';
import { jsPDF } from 'jspdf';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ message: 'Body non valido' }, { status: 400 });

    const vendorId = body.vendorId;
    const cantina = sanitize(body.cantina || '', 200);
    const rappresentante = sanitize(body.rappresentante || '', 200);
    const piva = sanitize(body.piva || '', 20);
    const indirizzo = sanitize(body.indirizzo || '', 500);
    const email = sanitize(body.email || '', 254);
    const telefono = sanitize(body.telefono || '', 30);
    const firma = sanitize(body.firma || '', 200);
    const firmaData = body.firmaData || '';
    const dataFirma = new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

    if (!vendorId || !email || (!firma && !firmaData)) {
      return NextResponse.json({ message: 'Dati mancanti' }, { status: 400 });
    }

    const wc = getWCSecrets();
    const auth = `consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;

    // Update vendor status (fire and forget)
    fetch(`${wc.baseUrl}/wp-json/wc/v3/customers/${vendorId}?${auth}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meta_data: [
          { key: '_vendor_status', value: 'pending_approval' },
          { key: '_vendor_contract_signed', value: 'true' },
          { key: '_vendor_contract_date', value: new Date().toISOString() },
          { key: '_vendor_rappresentante', value: rappresentante },
          { key: '_vendor_indirizzo', value: indirizzo },
        ],
      }),
    }).catch(err => console.error('Failed to update vendor meta:', err));

    // ─── Generate PDF ────────────────────────────────
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const w = pdf.internal.pageSize.getWidth();
    let y = 20;

    // Header
    pdf.setFillColor(0, 86, 103); // #005667
    pdf.rect(0, 0, w, 35, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('STAPPANDO', w / 2, 15, { align: 'center' });
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Contratto di Adesione ai Servizi', w / 2, 23, { align: 'center' });
    pdf.text(`Data: ${dataFirma}`, w / 2, 30, { align: 'center' });

    y = 45;
    pdf.setTextColor(26, 26, 26);

    // Parties
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('TRA:', 20, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Stappando s.r.l., Piazza Nicola Maria Nicolai 11 - Roma, P.IVA 15855661003', 32, y);
    y += 7;
    pdf.setFont('helvetica', 'bold');
    pdf.text('E:', 20, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${cantina || rappresentante}, ${indirizzo}, P.IVA ${piva}`, 32, y);
    y += 12;

    // Contract clauses
    const clauses = [
      { title: '1. OGGETTO DEL CONTRATTO', text: 'Stappando concede ai Vendor l\'accesso alla propria piattaforma di vendita online su www.stappando.it per promuovere e vendere prodotti vinicoli.' },
      { title: '2. REGISTRAZIONE E ACCETTAZIONE', text: 'La registrazione richiede il completamento del processo di iscrizione online. Stappando si riserva il diritto di accettare o rifiutare le candidature a propria discrezione.' },
      { title: '3. UTILIZZO DELLA PIATTAFORMA', text: 'I Vendor possono modificare o nascondere prodotti, gestire sconti e promozioni, monitorare ordini e gestire i dettagli dei prodotti attraverso la dashboard.' },
      { title: '4. COMMISSIONI E TARIFFE', text: 'Stappando applica una commissione del 15% sulle transazioni della piattaforma. Spedizione: 6,50EUR (gratuita sopra 69EUR). Pagamento entro il 10 del mese successivo.' },
      { title: '5. RESPONSABILITA\' DEL VENDOR', text: 'I Vendor assumono piena responsabilita\' per tutti i contenuti pubblicati. La vendita si perfeziona tra cliente e Vendor.' },
      { title: '6. GESTIONE SPEDIZIONI', text: 'Stappando fornisce tariffe corriere negoziate con ritiro automatico. Spedizione gratuita per ordini superiori a 69EUR.' },
      { title: '7. OBBLIGHI DEL VENDOR', text: 'Descrizioni accurate, disponibilita\' e qualita\' garantite, evasione tempestiva degli ordini.' },
      { title: '8. DISCREPANZE PRODOTTO', text: 'Stappando puo\' concedere sconti fino al 25% per difetti vendor. Dopo 3 ordini difettosi in 6 mesi: sospensione possibile.' },
      { title: '9. OBBLIGHI DI STAPPANDO', text: 'Accesso piattaforma, strumenti gestione, etichette spedizione, supporto tecnico, pagamento puntuale.' },
      { title: '10. DURATA E RISOLUZIONE', text: 'Durata annuale, rinnovo tacito. Disdetta: 30 giorni preavviso via PEC a stappandosrls@pec.it.' },
      { title: '11. LEGGE APPLICABILE', text: 'Legge italiana. Foro competente: Roma.' },
    ];

    for (const clause of clauses) {
      if (y > 260) { pdf.addPage(); y = 20; }
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 86, 103);
      pdf.text(clause.title, 20, y);
      y += 5;
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(68, 68, 68);
      const lines = pdf.splitTextToSize(clause.text, w - 40);
      pdf.text(lines, 20, y);
      y += lines.length * 4 + 4;
    }

    // Allegato A
    if (y > 240) { pdf.addPage(); y = 20; }
    y += 5;
    pdf.setFillColor(248, 246, 241);
    pdf.rect(15, y - 4, w - 30, 30, 'F');
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 86, 103);
    pdf.text('ALLEGATO A - CONDIZIONI ECONOMICHE', 20, y);
    y += 5;
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(68, 68, 68);
    pdf.text('Fee annuale visibilita\' vendor: EUR 0', 20, y); y += 4;
    pdf.text('Commissione vendite stappando.it: 15%', 20, y); y += 4;
    pdf.text('Commissione vendite vivino.com (opzionale): 35%', 20, y); y += 4;
    pdf.text('Creazione scheda prodotto (oltre le prime 5): EUR 10 cad.', 20, y);
    y += 15;

    // Signature section
    if (y > 230) { pdf.addPage(); y = 20; }
    pdf.setDrawColor(0, 86, 103);
    pdf.line(20, y, w - 20, y);
    y += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(26, 26, 26);
    pdf.text('DATI DEL FIRMATARIO', 20, y);
    y += 8;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const fields = [
      ['Cantina:', cantina],
      ['Rappresentante:', rappresentante],
      ['P.IVA:', piva],
      ['Indirizzo:', indirizzo],
      ['Email:', email],
      ['Telefono:', telefono],
    ];
    for (const [label, value] of fields) {
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(136, 136, 136);
      pdf.text(label, 20, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(26, 26, 26);
      pdf.text(value || '—', 55, y);
      y += 6;
    }

    y += 8;
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(26, 26, 26);
    pdf.text('FIRMA DIGITALE', 20, y);
    y += 8;

    // Add signature image or text
    if (firmaData && firmaData.startsWith('data:image')) {
      try {
        pdf.addImage(firmaData, 'PNG', 20, y, 80, 25);
        y += 30;
      } catch {
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'italic');
        pdf.text(firma || rappresentante, 20, y + 10);
        y += 20;
      }
    } else {
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(26, 26, 26);
      pdf.text(firma || rappresentante, 20, y + 5);
      y += 15;
    }

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(136, 136, 136);
    pdf.text(`Firmato digitalmente da ${rappresentante} in data ${dataFirma}`, 20, y);

    // Convert PDF to base64
    const pdfBase64 = pdf.output('datauristring').split(',')[1];
    const pdfFilename = `Contratto-Stappando-${(cantina || rappresentante).replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;

    // Build email HTML
    const contractHtml = `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:700px;margin:0 auto;background:#fff;">
        <div style="background:#005667;padding:24px 28px;text-align:center;">
          <img src="https://stappando.it/wp-content/uploads/2021/01/logo-stappando.png" alt="Stappando" style="height:28px;filter:brightness(0) invert(1);" />
        </div>
        <div style="padding:28px;">
          <h1 style="font-size:20px;color:#1a1a1a;margin:0 0 8px;">Contratto di Adesione Firmato</h1>
          <p style="font-size:13px;color:#888;margin:0 0 24px;">Data firma: ${dataFirma}</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
            <tr><td style="padding:8px 0;color:#888;width:140px;">Cantina</td><td style="padding:8px 0;font-weight:600;">${cantina}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Rappresentante</td><td style="padding:8px 0;font-weight:600;">${rappresentante}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">P.IVA</td><td style="padding:8px 0;font-weight:600;">${piva}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Indirizzo</td><td style="padding:8px 0;">${indirizzo}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Email</td><td style="padding:8px 0;">${email}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Telefono</td><td style="padding:8px 0;">${telefono}</td></tr>
          </table>
          <div style="border-top:1px solid #e8e4dc;padding-top:20px;margin-top:20px;">
            <p style="font-size:12px;color:#888;margin:0 0 8px;">Firma digitale:</p>
            ${firmaData
              ? `<img src="${firmaData}" alt="Firma" style="max-width:300px;height:80px;object-fit:contain;" />`
              : `<p style="font-size:18px;font-style:italic;color:#1a1a1a;font-family:cursive;">${firma}</p>`
            }
            <p style="font-size:11px;color:#888;margin-top:8px;">Firmato da: ${rappresentante} — ${dataFirma}</p>
          </div>
          <div style="background:#f8f6f1;border-radius:8px;padding:16px;margin-top:24px;">
            <p style="font-size:12px;color:#005667;font-weight:600;margin:0 0 4px;">Il contratto firmato e' allegato in PDF</p>
            <p style="font-size:12px;color:#666;margin:0;">Il team Stappando verifichera' i dati e attivera' il negozio entro 24-48 ore lavorative.</p>
          </div>
        </div>
      </div>`;

    const attachment = {
      type: 'application/pdf',
      name: pdfFilename,
      content: pdfBase64,
    };

    // Send to admin with PDF
    await sendEmail({
      to: [
        { email: 'maria@stappando.it', name: 'Maria Stappando' },
        { email: 'info@stappando.it', name: 'Stappando' },
      ],
      subject: `Contratto firmato: ${cantina || rappresentante}`,
      html: contractHtml,
      from_email: 'noreply@stappando.it',
      from_name: 'Stappando Vendor System',
      tags: ['vendor-contract'],
      attachments: [attachment],
    });

    // Send copy to vendor with PDF
    await sendEmail({
      to: [{ email, name: cantina || rappresentante }],
      subject: `Copia del tuo contratto di adesione — Stappando`,
      html: contractHtml + `
        <div style="padding:0 28px 28px;font-family:system-ui,-apple-system,sans-serif;max-width:700px;margin:0 auto;">
          <p style="font-size:13px;color:#888;margin-top:16px;">
            Questa e' una copia del contratto che hai firmato. Conservala per i tuoi archivi.<br/>
            Per qualsiasi domanda: <a href="mailto:assistenza@stappando.it" style="color:#005667;">assistenza@stappando.it</a>
          </p>
        </div>`,
      from_email: 'noreply@stappando.it',
      from_name: 'Stappando',
      tags: ['vendor-contract-copy'],
      attachments: [attachment],
    });

    console.log(`Vendor contract PDF sent: ${cantina || rappresentante} (${email})`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Vendor contract submit error:', err);
    return NextResponse.json({ message: 'Errore del server' }, { status: 500 });
  }
}
