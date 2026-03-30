import { create } from 'zustand';
import { CartItem } from '@/lib/types';

interface CartStore {
  cart: CartItem[];
  orderNote: string;
  isCartOpen: boolean;
  addItem: (item: CartItem) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  removeItem: (cartId: string) => void;
  clearCart: () => void;
  setOrderNote: (note: string) => void;
  openCart: () => void;
  closeCart: () => void;
}

export const useCartStore = create<CartStore>((set) => ({
  cart: [],
  orderNote: '',
  isCartOpen: false,
  
  addItem: (item) => set((s) => {
    const existingItem = s.cart.find((i) => i.cartId === item.cartId);
    if (existingItem) {
      // If it exists, map through and increase the quantity
      return {
        cart: s.cart.map((i) =>
          i.cartId === item.cartId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        ),
      };
    }
    // If it doesn't exist, add it as a new row
    return { cart: [...s.cart, item] };
  }),

  updateQuantity: (cartId, quantity) =>
    set((s) => ({
      cart: quantity < 1
        ? s.cart.filter((i) => i.cartId !== cartId)
        : s.cart.map((i) => i.cartId === cartId ? { ...i, quantity } : i),
    })),

  removeItem: (cartId) => set((s) => ({ cart: s.cart.filter((i) => i.cartId !== cartId) })),
  clearCart: () => set({ cart: [], orderNote: '', isCartOpen: false }),
  setOrderNote: (note) => set({ orderNote: note }),
  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
}));