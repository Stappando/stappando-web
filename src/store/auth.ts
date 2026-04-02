'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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

export interface SavedAddress {
  id: string;
  label?: string;
  first_name: string;
  last_name: string;
  address_1: string;
  city: string;
  state: string;
  postcode: string;
  phone?: string;
  isDefault: boolean;
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

export interface WCSubOrder {
  id: number;
  number: string;
  status: string;
  line_items: {
    id?: number;
    product_id: number;
    name: string;
    quantity: number;
    price?: string;
    total: string;
    image?: { src: string };
  }[];
  meta_data?: { key: string; value: string }[];
  shipping?: Address;
  _vendor_name?: string;
}

export interface WCOrder {
  id: number;
  number: string;
  status: string;
  date_created: string;
  total: string;
  currency: string;
  customer_note?: string;
  payment_method_title?: string;
  discount_total?: string;
  shipping_total?: string;
  coupon_lines?: { code: string; discount: string }[];
  meta_data?: { key: string; value: string }[];
  line_items: {
    id: number;
    product_id: number;
    name: string;
    quantity: number;
    price: string;
    total: string;
    image: { src: string };
  }[];
  billing: Address;
  shipping: Address;
  _sub_orders?: WCSubOrder[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  role: string;
  vendorStatus: string | null; // 'pending_contract' | 'pending_approval' | 'approved'
  isLoading: boolean;
  error: string | null;

  login: (username: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string, newsletter?: boolean) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  isAuthenticated: () => boolean;
  isVendor: () => boolean;
  setVendorStatus: (status: string) => void;
}

/* ── Store ─────────────────────────────────────────────── */

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      role: 'customer',
      vendorStatus: null,
      isLoading: false,
      error: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.message || 'Credenziali non valide');
          }

          set({ user: data.user, token: data.token, role: data.role || 'customer', vendorStatus: data.vendorStatus || null, isLoading: false, error: null });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Errore durante il login';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      register: async (email: string, password: string, firstName: string, lastName: string, newsletter: boolean = false) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, firstName, lastName, newsletter }),
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
        set({ user: null, token: null, role: 'customer', vendorStatus: null, error: null });
        // Clean vendor flags from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('stappando-is-vendor');
          localStorage.removeItem('stappando-vendor-status');
        }
      },

      clearError: () => set({ error: null }),

      isAuthenticated: () => !!get().token && !!get().user,
      isVendor: () => { const r = get().role; return r === 'vendor' || r === 'wcfm_vendor' || r === 'dc_vendor'; },
      setVendorStatus: (status: string) => set({ vendorStatus: status }),
    }),
    {
      name: 'stappando-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, token: state.token, role: state.role, vendorStatus: state.vendorStatus }),
    },
  ),
);

/* ── API helpers (call our proxy routes, not WC directly) ─ */

export async function fetchCustomer(userId: number): Promise<WCCustomer> {
  const res = await fetch(`/api/customers?id=${userId}`);
  if (!res.ok) throw new Error('Impossibile caricare i dati cliente');
  return res.json();
}

export async function updateCustomer(userId: number, data: Partial<WCCustomer>): Promise<WCCustomer> {
  const res = await fetch('/api/customers', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: userId, ...data }),
  });
  if (!res.ok) throw new Error('Impossibile aggiornare i dati');
  return res.json();
}

export async function fetchOrders(customerId: number): Promise<WCOrder[]> {
  const res = await fetch(`/api/orders?customerId=${customerId}`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchPoints(userId: number): Promise<{ points: number; history: { date: string; points: number; reason: string }[] }> {
  try {
    const res = await fetch(`/api/points?userId=${userId}`);
    if (!res.ok) return { points: 0, history: [] };
    return res.json();
  } catch {
    return { points: 0, history: [] };
  }
}

export async function changePassword(userId: number, newPassword: string): Promise<void> {
  const res = await fetch('/api/customers', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: userId, password: newPassword }),
  });
  if (!res.ok) throw new Error('Impossibile aggiornare la password');
}

export async function sendSupportTicket(data: { orderId: string; issue: string; email: string; name: string }): Promise<void> {
  const res = await fetch(`/api/contatti`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      subject: `Ticket Ordine ${data.orderId}`,
      message: data.issue,
    }),
  });
  if (!res.ok) {
    // Fallback: open mailto
    window.location.href = `mailto:assistenza@stappando.it?subject=Ticket Ordine ${data.orderId}&body=${encodeURIComponent(`Nome: ${data.name}\nEmail: ${data.email}\nOrdine: ${data.orderId}\n\n${data.issue}`)}`;
  }
}
