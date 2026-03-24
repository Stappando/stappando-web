/**
 * Mailchimp Marketing API client — server-side only.
 * For subscriber management on the main list (10k+ contacts).
 */

function getMailchimpConfig() {
  const apiKey = process.env.MAILCHIMP_API_KEY;
  const listId = process.env.MAILCHIMP_LIST_ID;
  if (!apiKey) throw new Error('Missing MAILCHIMP_API_KEY');
  if (!listId) throw new Error('Missing MAILCHIMP_LIST_ID');

  // Mailchimp API key format: <key>-<dc> (e.g., abc123-us21)
  const dc = apiKey.split('-').pop() || 'us21';
  const baseUrl = `https://${dc}.api.mailchimp.com/3.0`;

  return { apiKey, listId, baseUrl };
}

interface SubscribeParams {
  email: string;
  firstName?: string;
  lastName?: string;
  tags?: string[];
}

/** Subscribe email to the main Mailchimp list */
export async function subscribeToMailchimp(params: SubscribeParams): Promise<{ success: boolean; message?: string }> {
  const { apiKey, listId, baseUrl } = getMailchimpConfig();

  try {
    const res = await fetch(`${baseUrl}/lists/${listId}/members`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: params.email,
        status: 'subscribed',
        merge_fields: {
          FNAME: params.firstName || '',
          LNAME: params.lastName || '',
        },
        tags: params.tags || [],
      }),
    });

    if (res.ok) {
      console.log(`Mailchimp: subscribed ${params.email}`);
      return { success: true };
    }

    const data = await res.json();

    // "Member Exists" is not an error — they're already subscribed
    if (data.title === 'Member Exists') {
      return { success: true, message: 'Già iscritto' };
    }

    console.error('Mailchimp subscribe error:', data.title, data.detail);
    return { success: false, message: data.title || 'Errore iscrizione' };
  } catch (err) {
    console.error('Mailchimp subscribe failed:', err);
    return { success: false, message: 'Errore di connessione' };
  }
}
