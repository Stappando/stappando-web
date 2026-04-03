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

export interface ShippingData {
  firstName: string; lastName: string; email: string;
  address: string; zip: string; city: string; province?: string; phone: string;
  notes: string;
  needsInvoice?: boolean;
  ragioneSociale?: string;
  piva?: string;
  codFiscale?: string;
  sdi?: string;
}

export interface RecentlyViewed {
  id: number;
  slug: string;
  timestamp: number;
}

export interface LastOrder {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  popPoints: number;
  shippingData: ShippingData | null;
  vendorCount: number;
}

export interface AppliedCoupon {
  code: string;
  discount: number;
  type: string;
  description: string;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  checkoutOpen: boolean;
  checkoutStep: number;
  shippingData: ShippingData | null;
  recentlyViewed: RecentlyViewed[];
  lastOrder: LastOrder | null;
  appliedCoupon: AppliedCoupon | null;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  openCheckout: (step?: number) => void;
  closeCheckout: () => void;
  setCheckoutStep: (step: number) => void;
  setShippingData: (data: ShippingData) => void;
  applyCoupon: (coupon: AppliedCoupon) => void;
  removeCoupon: () => void;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  completeOrder: () => void;
  trackView: (id: number, slug: string) => void;
  getRecentlyViewedIds: () => number[];
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
      recentlyViewed: [],
      lastOrder: null,
      appliedCoupon: null,
      isOpen: false,
      checkoutOpen: false,
      checkoutStep: 1,
      shippingData: null,
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
      openCheckout: (step = 1) => set({ checkoutOpen: true, checkoutStep: step, isOpen: false }),
      closeCheckout: () => set({ checkoutOpen: false, checkoutStep: 1 }),
      setShippingData: (data) => set({ shippingData: data }),
      setCheckoutStep: (step) => set({ checkoutStep: step }),

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          if (existing) {
            return {
              items: state.items.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)),
            };
          }
          return { items: [...state.items, { ...item, quantity: 1 }] };
        });
      },

      removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      updateQuantity: (id, quantity) =>
        set((state) => {
          if (quantity <= 0) return { items: state.items.filter((i) => i.id !== id) };
          return { items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i)) };
        }),

      applyCoupon: (coupon) => set({ appliedCoupon: coupon }),
      removeCoupon: () => set({ appliedCoupon: null }),

      clearCart: () => set({ items: [], appliedCoupon: null }),

      completeOrder: () => {
        const s = get();
        const subtotal = s.getSubtotal();
        const shipping = s.getTotalShipping();
        const total = s.getTotal();
        const vendors = new Set(s.items.map(i => i.vendorName));
        set({
          lastOrder: {
            items: [...s.items],
            subtotal,
            shipping,
            total,
            popPoints: Math.round(total),
            shippingData: s.shippingData,
            vendorCount: vendors.size,
          },
          items: [],
        });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('stappando_dedica');
          localStorage.removeItem('stappando_carrier');
        }
      },

      trackView: (id: number, slug: string) => {
        const rv = get().recentlyViewed.filter(v => v.id !== id);
        rv.unshift({ id, slug, timestamp: Date.now() });
        set({ recentlyViewed: rv.slice(0, 20) }); // Keep last 20
      },

      getRecentlyViewedIds: () => get().recentlyViewed.map(v => v.id),

      getSubtotal: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

      getVendorShipping: () => {
        // Group by vendorName (not vendorId) — consistent regardless of ID source
        const vendorTotals: Record<string, { vendorId: string; total: number }> = {};
        get().items.forEach((item) => {
          if (item.vendorId === 'giftcard') return;
          const key = item.vendorName; // bucket by display name
          if (!vendorTotals[key])
            vendorTotals[key] = { vendorId: item.vendorId, total: 0 };
          vendorTotals[key].total += item.price * item.quantity;
        });
        const threshold = API_CONFIG.freeShippingThreshold;
        return Object.entries(vendorTotals).map(([vendorName, data]) => {
          const isFree = data.total >= threshold;
          return {
            vendorId: data.vendorId,
            vendorName,
            total: data.total,
            isFree,
            remaining: isFree ? 0 : threshold - data.total,
            percentage: Math.min(100, Math.round((data.total / threshold) * 100)),
            shippingCost: isFree ? 0 : API_CONFIG.defaultShippingCost,
          };
        });
      },

      getTotalShipping: () => get().getVendorShipping().reduce((sum, v) => sum + v.shippingCost, 0),
      getTotal: () => {
        const subtotal = get().getSubtotal();
        const shipping = get().getTotalShipping();
        const couponDiscount = get().appliedCoupon?.discount || 0;
        return Math.max(0, subtotal + shipping - couponDiscount);
      },
      getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: 'stappando-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
