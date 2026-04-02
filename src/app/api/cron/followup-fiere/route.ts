/**
 * GET /api/cron/followup-fiere
 *
 * Daily cron — sends follow-up emails to cantine that received the fiere
 * presentation (email 0). Reads Google Sheets, checks timing, sends via
 * Mandrill, and updates the sheet counters.
 *
 * Column mapping (0-indexed from sheet):
 *   A(0): Azienda | D(3): Email | K(10): Contatto
 *   R(17): Closing | S(18): Presentazione (0–8) | T(19): Ultimo contatto
 *
 * Presentazione values:
 *   '' or 'Inviata' → legacy, skip
 *   '0'–'7'         → sequence in progress, send N+1 when timing is right
 *   '8'             → sequence complete, skip
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/mail/mandrill';
import {
  fiereFollowUp1,
  fiereFollowUp2,
  fiereFollowUp3,
  fiereFollowUp4,
  fiereFollowUp5,
  fiereFollowUp6,
  fiereFollowUp7,
  fiereFollowUp8,
} from '@/lib/mail/templates';
import {
  getGSheetsToken,
  sheetsGet,
  sheetsUpdate,
  FIERE_SPREADSHEET_ID,
  FIERE_SHEET_NAME,
} from '@/lib/google-sheets';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/* ── Config ─────────────────────────────────────────────── */

const MAX_EMAILS_PER_RUN = 50;

/**
 * Days to wait AFTER email N before sending email N+1.
 * Index 0 = days after email 0 before sending email 1, etc.
 */
const GAPS = [5, 7, 8, 8, 7, 7, 8, 8];

const FOLLOW_UPS = [
  fiereFollowUp1,
  fiereFollowUp2,
  fiereFollowUp3,
  fiereFollowUp4,
  fiereFollowUp5,
  fiereFollowUp6,
  fiereFollowUp7,
  fiereFollowUp8,
];

/* ── Jitter ─────────────────────────────────────────────── */

/** Deterministic ±1 day jitter based on email hash. */
function emailJitter(email: string): number {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = ((hash * 31) + email.charCodeAt(i)) | 0;
  }
  return (((hash % 3) + 3) % 3) - 1; // -1, 0, or +1
}

/* ── Date helpers ───────────────────────────────────────── */

/** Parse MM/DD/YYYY or DD/MM/YYYY HH:MM → Date */
function parseSheetDate(raw: string): Date | null {
  if (!raw) return null;
  const s = raw.trim().split(' ')[0]; // take date part only
  const parts = s.split('/');
  if (parts.length !== 3) return null;
  const [a, b, c] = parts.map(Number);
  if (isNaN(a) || isNaN(b) || isNaN(c)) return null;
  // Determine format: if month > 12 then it must be DD/MM/YYYY (old format)
  if (a > 12) {
    // DD/MM/YYYY
    return new Date(Date.UTC(c, b - 1, a));
  }
  // MM/DD/YYYY (new format)
  return new Date(Date.UTC(c, a - 1, b));
}

function todayMmDdYyyy(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`;
}

function daysSince(date: Date): number {
  const now = Date.now();
  return Math.floor((now - date.getTime()) / 86400000);
}

/* ── Main handler ───────────────────────────────────────── */

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!saJson) {
    return NextResponse.json({ error: 'Missing GOOGLE_SERVICE_ACCOUNT_JSON' }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;
  let errors = 0;

  try {
    const serviceAccount = JSON.parse(saJson);
    const token = await getGSheetsToken(serviceAccount);

    // Read all rows A:T (20 columns)
    const rows = await sheetsGet(token, FIERE_SPREADSHEET_ID, `${FIERE_SHEET_NAME}!A:T`);
    const today = todayMmDdYyyy();

    for (let i = 0; i < rows.length; i++) {
      if (sent >= MAX_EMAILS_PER_RUN) break;

      const row = rows[i];
      const azienda  = (row[0]  || '').trim();
      const email    = (row[3]  || '').trim();
      const contatto = (row[10] || '').trim();
      const closing  = (row[17] || '').trim().toLowerCase();
      const presentazione = (row[18] || '').trim();
      const ultimoContatto = (row[19] || '').trim();

      // Skip: no email
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { skipped++; continue; }

      // Skip: closed
      if (closing === 'registrato' || closing === 'no interesse') { skipped++; continue; }

      // Skip: not started (empty or legacy "Inviata")
      if (!presentazione || presentazione.toLowerCase() === 'inviata') { skipped++; continue; }

      const currentNum = parseInt(presentazione, 10);
      if (isNaN(currentNum)) { skipped++; continue; }

      // Skip: sequence complete
      if (currentNum >= 8) { skipped++; continue; }

      // Determine how many days we need to wait
      const requiredDays = GAPS[currentNum] + emailJitter(email);

      // Parse last contact date
      const lastDate = parseSheetDate(ultimoContatto);
      if (!lastDate) { skipped++; continue; }

      const elapsed = daysSince(lastDate);
      if (elapsed < requiredDays) { skipped++; continue; }

      // Time to send email currentNum+1
      const nextNum = currentNum + 1;
      const templateFn = FOLLOW_UPS[nextNum - 1]; // 1-indexed to 0-indexed
      const name = contatto || azienda || 'Cantina';
      const { subject, html } = templateFn(name);

      try {
        await sendEmail({
          to: [{ email, name, type: 'to' as const }],
          from_email: 'ordini@stappando.it',
          from_name: 'Roberto — Stappando',
          subject,
          html,
          tags: ['fiere', 'followup', `followup-${nextNum}`],
        });

        // Update sheet: S = new counter, T = today
        const sheetRow = i + 1; // 1-indexed
        await sheetsUpdate(
          token,
          FIERE_SPREADSHEET_ID,
          `${FIERE_SHEET_NAME}!S${sheetRow}:T${sheetRow}`,
          [[String(nextNum), today]],
        );

        sent++;
        console.log(`[followup-fiere] Sent email ${nextNum} to ${email} (row ${sheetRow})`);
      } catch (err) {
        errors++;
        console.error(`[followup-fiere] Error sending to ${email}:`, err);
      }
    }
  } catch (err) {
    console.error('[followup-fiere] Fatal error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }

  return NextResponse.json({
    sent,
    skipped,
    errors,
    timestamp: new Date().toISOString(),
  });
}
