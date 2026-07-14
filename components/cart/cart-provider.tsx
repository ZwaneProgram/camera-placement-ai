"use client";

import * as React from "react";
import { toast } from "sonner";

import type { Product } from "@/lib/products";
import { formatBaht } from "@/lib/utils";

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
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [open, setOpen] = React.useState(false);

  // Hydrate from localStorage once on mount.
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore malformed storage */
    }
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable */
    }
  }, [items]);

  const add = React.useCallback(
    (product: Pick<Product, "id" | "name" | "price">, qty = 1) => {
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
      toast(`เพิ่ม "${product.name}" ลงตะกร้าแล้ว`, { duration: 2200 });
    },
    []
  );

  const changeQty = React.useCallback((id: number, delta: number) => {
    setItems((prev) =>
      prev
        .map((x) => (x.id === id ? { ...x, qty: x.qty + delta } : x))
        .filter((x) => x.qty > 0)
    );
  }, []);

  const remove = React.useCallback((id: number) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

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
