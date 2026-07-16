"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import type { Product } from "@/lib/products";
import { formatBaht } from "@/lib/utils";
import {
  addToCart,
  setCartQty,
  removeFromCart,
  mergeGuestCart,
  getCartDetailed,
} from "@/lib/cart-actions";

export interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  total: number;
  totalLabel: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  add: (product: Pick<Product, "id" | "name" | "price">, qty?: number) => void;
  changeQty: (id: number, delta: number) => void;
  remove: (id: number) => void;
}

const CartContext = React.createContext<CartContextValue | null>(null);

const STORAGE_KEY = "sv-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const authed = status === "authenticated";
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [open, setOpen] = React.useState(false);
  const mergedRef = React.useRef(false);

  // Guest hydrate from localStorage (only while unauthenticated).
  React.useEffect(() => {
    if (authed) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setItems(raw ? JSON.parse(raw) : []);
    } catch {
      setItems([]);
    }
  }, [authed]);

  // Persist to localStorage only while guest.
  React.useEffect(() => {
    if (authed) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable */
    }
  }, [items, authed]);

  // On login: merge guest cart into DB, clear local, load DB cart.
  React.useEffect(() => {
    if (!authed || mergedRef.current) return;
    mergedRef.current = true;
    (async () => {
      let guest: { id: number; qty: number }[] = [];
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        guest = raw
          ? JSON.parse(raw).map((i: CartItem) => ({ id: i.id, qty: i.qty }))
          : [];
      } catch {
        guest = [];
      }
      if (guest.length) await mergeGuestCart(guest);
      localStorage.removeItem(STORAGE_KEY);
      setItems(await getCartDetailed());
    })();
  }, [authed]);

  // Reset the merge guard on logout so next login re-triggers merge.
  React.useEffect(() => {
    if (!authed) mergedRef.current = false;
  }, [authed]);

  const add = React.useCallback(
    (product: Pick<Product, "id" | "name" | "price">, qty = 1) => {
      if (authed) {
        addToCart(product.id, qty).then(() => getCartDetailed().then(setItems));
      } else {
        setItems((prev) => {
          const i = prev.findIndex((x) => x.id === product.id);
          if (i >= 0) {
            const next = [...prev];
            next[i] = { ...next[i], qty: next[i].qty + qty };
            return next;
          }
          return [
            ...prev,
            { id: product.id, name: product.name, price: product.price, qty },
          ];
        });
      }
      toast(`เพิ่ม "${product.name}" ลงตะกร้าแล้ว`, { duration: 2200 });
    },
    [authed]
  );

  const changeQty = React.useCallback(
    (id: number, delta: number) => {
      if (authed) {
        const current = items.find((x) => x.id === id);
        const nextQty = (current?.qty ?? 0) + delta;
        setCartQty(id, nextQty).then(() => getCartDetailed().then(setItems));
      } else {
        setItems((prev) =>
          prev
            .map((x) => (x.id === id ? { ...x, qty: x.qty + delta } : x))
            .filter((x) => x.qty > 0)
        );
      }
    },
    [authed, items]
  );

  const remove = React.useCallback(
    (id: number) => {
      if (authed) {
        removeFromCart(id).then(() => getCartDetailed().then(setItems));
      } else {
        setItems((prev) => prev.filter((x) => x.id !== id));
      }
    },
    [authed]
  );

  const count = items.reduce((a, c) => a + c.qty, 0);
  const total = items.reduce((a, c) => a + c.price * c.qty, 0);

  const value: CartContextValue = {
    items,
    count,
    total,
    totalLabel: formatBaht(total),
    open,
    setOpen,
    toggle: () => setOpen((o) => !o),
    add,
    changeQty,
    remove,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
