'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { API_CONFIG } from '@/lib/config';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  vendorId: string;
  vendorName: string;
}

export interface VendorShipping {
  vendorId: string;
  vendorName: string;
  total: number;
  isFree: boolean;
  remaining: number;
  percentage: number;
  shippingCost: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getVendorShipping: () => VendorShipping[];
  getTotalShipping: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          if (existing) {
            return {
              items: state.items.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)),
              isOpen: true,
            };
          }
          return { items: [...state.items, { ...item, quantity: 1 }], isOpen: true };
        });
      },

      removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      updateQuantity: (id, quantity) =>
        set((state) => {
          if (quantity <= 0) return { items: state.items.filter((i) => i.id !== id) };
          return { items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i)) };
        }),

      clearCart: () => set({ items: [] }),

      getSubtotal: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

      getVendorShipping: () => {
        const vendorTotals: Record<string, { name: string; total: number }> = {};
        get().items.forEach((item) => {
          if (item.vendorId === 'giftcard') return;
          if (!vendorTotals[item.vendorId])
            vendorTotals[item.vendorId] = { name: item.vendorName, total: 0 };
          vendorTotals[item.vendorId].total += item.price * item.quantity;
        });
        const threshold = API_CONFIG.freeShippingThreshold;
        return Object.entries(vendorTotals).map(([vendorId, data]) => {
          const isFree = data.total >= threshold;
          return {
            vendorId,
            vendorName: data.name,
            total: data.total,
            isFree,
            remaining: isFree ? 0 : threshold - data.total,
            percentage: Math.min(100, Math.round((data.total / threshold) * 100)),
            shippingCost: isFree ? 0 : API_CONFIG.defaultShippingCost,
          };
        });
      },

      getTotalShipping: () => get().getVendorShipping().reduce((sum, v) => sum + v.shippingCost, 0),
      getTotal: () => get().getSubtotal() + get().getTotalShipping(),
      getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: 'stappando-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
