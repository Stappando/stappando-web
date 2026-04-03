/** Parse a Vivino order notification email into structured data */

export interface VivinoParsedOrder {
  vivinoOrderId: string;
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

export function parseVivinoEmail(text: string): VivinoParsedOrder | null {
  try {
    // Order ID: "N. ordine: X1I14F5Q"
    const orderIdMatch = text.match(/N\.\s*ordine:\s*(\S+)/i);
    const vivinoOrderId = orderIdMatch?.[1] || '';

    // Customer name: first line after "Indirizzo di spedizione:"
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

    // Parse "Milano mi 20141" or "Roma RM 00100"
    const cityLine = addrLines[2] || '';
    const zipMatch = cityLine.match(/(\d{5})/);
    const zip = zipMatch?.[1] || '';
    const provMatch = cityLine.match(/\b([a-zA-Z]{2})\b(?=\s*\d{5})|(?:\d{5}\s*)([a-zA-Z]{2})\b/);
    const province = (provMatch?.[1] || provMatch?.[2] || '').toUpperCase();
    const city = cityLine
      .replace(/\d{5}/, '')
      .replace(new RegExp(`\\b${province}\\b`, 'i'), '')
      .trim()
      .replace(/,\s*$/, '');

    // Phone
    const phoneLine = addrLines.find(l => /^\+?\d[\d\s-]{6,}/.test(l));
    const phone = phoneLine?.trim() || '';

    // Quantity: "N bottiglia"
    const qtyMatch = text.match(/(\d+)\s*bottigli[ae]/i);
    const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;

    // Product name: after "Dettagli" — producer + wine name
    const detailBlock = text.split(/Dettagli/i)[1] || text.split(/Riepilogo del suo ordine/i)[1] || '';
    const detailLines = detailBlock
      .split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.match(/^\d+\s*bottigli/i) && !l.match(/^Bottle/i) && !l.match(/^€/) && !l.match(/^Totale/i) && !l.match(/^Spedizione/i) && !l.match(/Tax/i) && !l.match(/Beverage/i) && !l.match(/^\|/) && !l.match(/^Gratis/i));

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

    return { vivinoOrderId, firstName, lastName, address, city, province, zip, phone, productName, quantity, total };
  } catch {
    return null;
  }
}
