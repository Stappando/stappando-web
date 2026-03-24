/** Lightweight input validation for API routes — server-side only. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(v: unknown): v is string {
  return typeof v === 'string' && v.length <= 254 && EMAIL_RE.test(v);
}

export function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

export function isPositiveInt(v: unknown): v is number {
  if (typeof v === 'number') return Number.isInteger(v) && v > 0;
  if (typeof v === 'string') {
    const n = parseInt(v, 10);
    return !isNaN(n) && n > 0 && String(n) === v;
  }
  return false;
}

/** Sanitize string: trim and cap length to prevent abuse */
export function sanitize(v: unknown, maxLen = 1000): string {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, maxLen);
}
