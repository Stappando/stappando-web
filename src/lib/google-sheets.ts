/**
 * Shared Google Sheets utilities — no SDK, plain fetch + WebCrypto.
 */

export const FIERE_SPREADSHEET_ID = '1sjxo95pOQz76jizopNgjMiHc3A0u1mnhbROuTxAQ948';
export const FIERE_SHEET_NAME = 'cantine';

const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

/* ── JWT / OAuth ─────────────────────────────────────────── */

function base64url(input: string): string {
  return btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function getGSheetsToken(
  serviceAccount: { client_email: string; private_key: string },
): Promise<string> {
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const claim = base64url(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: SHEETS_SCOPE,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsignedToken = `${header}.${claim}`;

  const pemBody = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  const binaryKey = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsignedToken),
  );

  const sigBytes = new Uint8Array(signature);
  let sigStr = '';
  for (let i = 0; i < sigBytes.length; i++) {
    sigStr += String.fromCharCode(sigBytes[i]);
  }
  const sig = base64url(sigStr);
  const jwt = `${unsignedToken}.${sig}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google OAuth failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

/* ── Sheets helpers ──────────────────────────────────────── */

/**
 * Backward-compatible alias — reads service account from env and returns token.
 * @deprecated Use getGSheetsToken(serviceAccount) instead.
 */
export async function getGoogleAccessToken(): Promise<string> {
  const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!saJson) throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_JSON');
  return getGSheetsToken(JSON.parse(saJson));
}

export async function sheetsGet(
  token: string,
  spreadsheetId: string,
  range: string,
): Promise<string[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sheets GET failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return (data.values as string[][] | undefined) || [];
}

export async function sheetsUpdate(
  token: string,
  spreadsheetId: string,
  range: string,
  values: string[][],
): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ range, values }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sheets PUT failed: ${res.status} ${text}`);
  }
}

export async function sheetsAppend(
  token: string,
  spreadsheetId: string,
  range: string,
  values: string[][],
): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sheets APPEND failed: ${res.status} ${text}`);
  }
}
