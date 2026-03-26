/**
 * Mandrill (Mailchimp Transactional) API client — server-side only.
 * Uses the REST API directly, no SDK needed.
 */

function getMandrillConfig() {
  const apiKey = process.env.MANDRILL_API_KEY;
  if (!apiKey) throw new Error('Missing MANDRILL_API_KEY');
  return { apiKey };
}

interface MandrillRecipient {
  email: string;
  name?: string;
}

interface MandrillAttachment {
  type: string;
  name: string;
  content: string; // base64
}

interface MandrillMessage {
  to: MandrillRecipient[];
  subject: string;
  html: string;
  from_email?: string;
  from_name?: string;
  tags?: string[];
  attachments?: MandrillAttachment[];
}

interface MandrillResponse {
  email: string;
  status: 'sent' | 'queued' | 'rejected' | 'invalid';
  reject_reason?: string;
  _id: string;
}

/** Send a transactional email via Mandrill */
export async function sendEmail(message: MandrillMessage): Promise<MandrillResponse[]> {
  const { apiKey } = getMandrillConfig();

  const res = await fetch('https://mandrillapp.com/api/1.0/messages/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key: apiKey,
      message: {
        from_email: message.from_email || 'ordini@stappando.it',
        from_name: message.from_name || 'Stappando',
        to: message.to,
        subject: message.subject,
        html: message.html,
        tags: message.tags || [],
        track_opens: true,
        track_clicks: true,
        inline_css: true,
        preserve_recipients: false,
        ...(message.attachments?.length ? { attachments: message.attachments } : {}),
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Mandrill send failed: ${res.status} ${err}`);
  }

  return res.json();
}
