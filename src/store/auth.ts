'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { API_CONFIG } from '@/lib/config';

/* ── Types ─────────────────────────────────────────────── */

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
}

export interface Address {
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone: string;
  email?: string;
}

export interface WCCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  billing: Address;
  shipping: Address;
  avatar_url: string;
}

export interface WCOrder {
  id: number;
  number: string;
  status: string;
  date_created: string;
  total: string;
  currency: string;
  line_items: {
    id: number;
    name: string;
    quantity: number;
    total: string;
    image: { src: string };
  }[];
  billing: Address;
  shipping: Address;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  login: (username: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  isAuthenticated: () => boolean;
}

const { baseUrl, wc } = API_CONFIG;

/* ── Store ─────────────────────────────────────────────── */

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          // Get JWT token
          const tokenRes = await fetch(`${baseUrl}/wp-json/jwt-auth/v1/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
          });
          const tokenData = await tokenRes.json();
          if (!tokenRes.ok) {
            throw new Error(tokenData.message || 'Credenziali non valide');
          }

          // JWT response has data nested
          const email = tokenData.data?.email || tokenData.user_email || username;
          const userId = tokenData.data?.id || tokenData.user_id || 0;
          const nicename = tokenData.data?.nicename || tokenData.user_nicename || username;
          const token = tokenData.data?.token || tokenData.token;
          const firstName = tokenData.data?.firstName || '';
          const lastName = tokenData.data?.lastName || '';

          // Try to fetch customer data from WC
          let custFirstName = firstName;
          let custLastName = lastName;
          let custId = userId;
          try {
            const customersUrl = `${baseUrl}${wc.endpoint}/customers?email=${encodeURIComponent(email)}&consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;
            const custRes = await fetch(customersUrl);
            if (custRes.ok) {
              const customers: WCCustomer[] = await custRes.json();
              if (customers[0]) {
                custFirstName = customers[0].first_name || custFirstName;
                custLastName = customers[0].last_name || custLastName;
                custId = customers[0].id || custId;
              }
            }
          } catch { /* ok, use JWT data */ }

          const user: User = {
            id: custId,
            email,
            firstName: custFirstName,
            lastName: custLastName,
            username: nicename,
          };

          set({ user, token, isLoading: false, error: null });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Errore durante il login';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      register: async (email: string, password: string, firstName: string, lastName: string) => {
        set({ isLoading: true, error: null });
        try {
          const url = `${baseUrl}${wc.endpoint}/customers?consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              password,
              first_name: firstName,
              last_name: lastName,
              username: email,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.message || 'Errore durante la registrazione');
          }

          // Auto-login after registration
          await get().login(email, password);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Errore durante la registrazione';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      logout: () => {
        set({ user: null, token: null, error: null });
      },

      clearError: () => set({ error: null }),

      isAuthenticated: () => !!get().token && !!get().user,
    }),
    {
      name: 'stappando-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, token: state.token }),
    },
  ),
);

/* ── API helpers (require auth token) ──────────────────── */

export async function fetchCustomer(userId: number): Promise<WCCustomer> {
  const url = `${baseUrl}${wc.endpoint}/customers/${userId}?consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Impossibile caricare i dati cliente');
  return res.json();
}

export async function updateCustomer(userId: number, data: Partial<WCCustomer>): Promise<WCCustomer> {
  const url = `${baseUrl}${wc.endpoint}/customers/${userId}?consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Impossibile aggiornare i dati');
  return res.json();
}

export async function fetchOrders(customerId: number): Promise<WCOrder[]> {
  const url = `${baseUrl}${wc.endpoint}/orders?customer=${customerId}&per_page=20&orderby=date&order=desc&consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchPoints(userId: number): Promise<{ points: number; history: { date: string; points: number; reason: string }[] }> {
  try {
    const url = `${baseUrl}/wp-json/stp-app/v1/points/${userId}`;
    const res = await fetch(url);
    if (!res.ok) return { points: 0, history: [] };
    return res.json();
  } catch {
    return { points: 0, history: [] };
  }
}

export async function changePassword(userId: number, newPassword: string): Promise<void> {
  const url = `${baseUrl}${wc.endpoint}/customers/${userId}?consumer_key=${wc.consumerKey}&consumer_secret=${wc.consumerSecret}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: newPassword }),
  });
  if (!res.ok) throw new Error('Impossibile aggiornare la password');
}

export async function sendSupportTicket(data: { orderId: string; issue: string; email: string; name: string }): Promise<void> {
  const url = `${baseUrl}/wp-json/stp-app/v1/support-ticket`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      order_id: data.orderId,
      issue: data.issue,
      customer_email: data.email,
      customer_name: data.name,
      support_email: 'assistenza@stappando.it',
    }),
  });
  if (!res.ok) {
    // Fallback: open mailto
    window.location.href = `mailto:assistenza@stappando.it?subject=Ticket Ordine ${data.orderId}&body=${encodeURIComponent(`Nome: ${data.name}\nEmail: ${data.email}\nOrdine: ${data.orderId}\n\n${data.issue}`)}`;
  }
}
