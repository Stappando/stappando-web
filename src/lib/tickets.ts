/**
 * Ticket system — stored as WordPress Posts via WP REST API.
 * Each ticket post:
 *   post_title:   "[CID-{customerId}] {subject}"
 *   post_content: JSON blob (see TicketContent below)
 *   post_status:  "publish"
 *   categories:   [WP_TICKET_CATEGORY_ID]
 */

import { getWPAdminAuth, getTicketCategoryId } from '@/lib/config';

export type TicketStatus = 'open' | 'in_progress' | 'closed';
export type TicketCategory = 'ordine' | 'prodotto' | 'pagamento' | 'spedizione' | 'reso' | 'altro';
export type MessageFrom = 'customer' | 'admin' | 'vendor';

export interface TicketMessage {
  id: string;
  from: MessageFrom;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface TicketContent {
  status: TicketStatus;
  category: TicketCategory;
  customerId: number;
  customerEmail: string;
  customerName: string;
  orderId?: string;
  messages: TicketMessage[];
}

export interface Ticket extends TicketContent {
  id: number; // WP post ID
  subject: string;
  createdAt: string;
  updatedAt: string;
}

function parseTicket(post: Record<string, unknown>): Ticket | null {
  try {
    const content = typeof post.content === 'object' && post.content !== null
      ? (post.content as { rendered: string }).rendered
      : String(post.content || '');
    // Strip HTML tags (WP wraps content in <p> tags)
    const rawJson = content.replace(/<[^>]+>/g, '').trim();
    const data: TicketContent = JSON.parse(rawJson);
    const title = String(post.title && typeof post.title === 'object' ? (post.title as { rendered: string }).rendered : post.title || '');
    // Remove CID prefix from title
    const subject = title.replace(/^\[CID-\d+\]\s*/, '');
    return {
      ...data,
      id: post.id as number,
      subject,
      createdAt: String(post.date || ''),
      updatedAt: String(post.modified || ''),
    };
  } catch {
    return null;
  }
}

function wpHeaders(authHeader: string) {
  return {
    Authorization: authHeader,
    'Content-Type': 'application/json',
  };
}

export async function createTicket(params: {
  customerId: number;
  customerEmail: string;
  customerName: string;
  subject: string;
  category: TicketCategory;
  orderId?: string;
  message: string;
}): Promise<Ticket | null> {
  const auth = getWPAdminAuth();
  if (!auth) throw new Error('WP admin auth not configured (WP_ADMIN_USER + WP_ADMIN_APP_PASSWORD)');

  const catId = getTicketCategoryId();
  const content: TicketContent = {
    status: 'open',
    category: params.category,
    customerId: params.customerId,
    customerEmail: params.customerEmail,
    customerName: params.customerName,
    orderId: params.orderId,
    messages: [
      {
        id: crypto.randomUUID(),
        from: 'customer',
        authorName: params.customerName,
        content: params.message,
        createdAt: new Date().toISOString(),
      },
    ],
  };

  const res = await fetch(`${auth.baseUrl}/wp-json/wp/v2/posts`, {
    method: 'POST',
    headers: wpHeaders(auth.authHeader),
    body: JSON.stringify({
      title: `[CID-${params.customerId}] ${params.subject}`,
      content: JSON.stringify(content),
      status: 'publish',
      categories: catId ? [catId] : [],
      comment_status: 'closed',
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('createTicket error:', err);
    throw new Error(`WP post creation failed: ${res.status}`);
  }

  const post = await res.json();
  return parseTicket(post);
}

export async function listTickets(filter: {
  customerId?: number;
  status?: TicketStatus | 'all';
  search?: string;
  perPage?: number;
  page?: number;
}): Promise<Ticket[]> {
  const auth = getWPAdminAuth();
  if (!auth) return [];

  const catId = getTicketCategoryId();
  const params = new URLSearchParams({
    per_page: String(filter.perPage || 50),
    page: String(filter.page || 1),
    orderby: 'modified',
    order: 'desc',
    status: 'publish',
  });

  if (catId) params.set('categories', String(catId));
  if (filter.customerId) params.set('search', `CID-${filter.customerId}`);
  else if (filter.search) params.set('search', filter.search);

  const res = await fetch(`${auth.baseUrl}/wp-json/wp/v2/posts?${params}`, {
    headers: { Authorization: auth.authHeader },
  });

  if (!res.ok) return [];
  const posts: Record<string, unknown>[] = await res.json();
  const tickets = posts.map(parseTicket).filter((t): t is Ticket => t !== null);

  // Filter by status client-side (status is in JSON content)
  if (filter.status && filter.status !== 'all') {
    return tickets.filter(t => t.status === filter.status);
  }
  return tickets;
}

export async function getTicket(wpPostId: number): Promise<Ticket | null> {
  const auth = getWPAdminAuth();
  if (!auth) return null;

  const res = await fetch(`${auth.baseUrl}/wp-json/wp/v2/posts/${wpPostId}`, {
    headers: { Authorization: auth.authHeader },
  });

  if (!res.ok) return null;
  return parseTicket(await res.json());
}

export async function replyToTicket(wpPostId: number, reply: {
  from: MessageFrom;
  authorName: string;
  content: string;
}): Promise<Ticket | null> {
  const auth = getWPAdminAuth();
  if (!auth) throw new Error('WP admin auth not configured');

  const ticket = await getTicket(wpPostId);
  if (!ticket) throw new Error('Ticket not found');

  const updatedContent: TicketContent = {
    ...ticket,
    messages: [
      ...ticket.messages,
      {
        id: crypto.randomUUID(),
        from: reply.from,
        authorName: reply.authorName,
        content: reply.content,
        createdAt: new Date().toISOString(),
      },
    ],
    // Re-open if admin/vendor replies to a non-closed ticket
    status: ticket.status === 'closed' ? 'closed' : (reply.from !== 'customer' ? 'in_progress' : ticket.status),
  };

  const res = await fetch(`${auth.baseUrl}/wp-json/wp/v2/posts/${wpPostId}`, {
    method: 'POST',
    headers: wpHeaders(auth.authHeader),
    body: JSON.stringify({ content: JSON.stringify(updatedContent) }),
  });

  if (!res.ok) throw new Error(`Reply failed: ${res.status}`);
  return parseTicket(await res.json());
}

export async function updateTicketStatus(wpPostId: number, status: TicketStatus): Promise<Ticket | null> {
  const auth = getWPAdminAuth();
  if (!auth) throw new Error('WP admin auth not configured');

  const ticket = await getTicket(wpPostId);
  if (!ticket) throw new Error('Ticket not found');

  const updatedContent: TicketContent = { ...ticket, status };
  const res = await fetch(`${auth.baseUrl}/wp-json/wp/v2/posts/${wpPostId}`, {
    method: 'POST',
    headers: wpHeaders(auth.authHeader),
    body: JSON.stringify({ content: JSON.stringify(updatedContent) }),
  });

  if (!res.ok) throw new Error(`Status update failed: ${res.status}`);
  return parseTicket(await res.json());
}
