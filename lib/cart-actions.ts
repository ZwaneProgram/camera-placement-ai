"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { mergeCarts, type CartLine } from "@/lib/cart-merge";

async function userId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

async function readCart(uid: string): Promise<CartLine[]> {
  const rows = await prisma.cartItem.findMany({
    where: { userId: uid },
    orderBy: { productId: "asc" },
  });
  return rows.map((r) => ({ id: r.productId, qty: r.qty }));
}

export async function getCart(): Promise<CartLine[]> {
  const uid = await userId();
  if (!uid) return [];
  return readCart(uid);
}

export async function addToCart(productId: number, qty = 1): Promise<CartLine[]> {
  const uid = await userId();
  if (!uid) return [];
  await prisma.cartItem.upsert({
    where: { userId_productId: { userId: uid, productId } },
    update: { qty: { increment: qty } },
    create: { userId: uid, productId, qty },
  });
  return readCart(uid);
}

export async function setCartQty(productId: number, qty: number): Promise<CartLine[]> {
  const uid = await userId();
  if (!uid) return [];
  if (qty <= 0) {
    await prisma.cartItem.deleteMany({ where: { userId: uid, productId } });
  } else {
    await prisma.cartItem.upsert({
      where: { userId_productId: { userId: uid, productId } },
      update: { qty },
      create: { userId: uid, productId, qty },
    });
  }
  return readCart(uid);
}

export async function removeFromCart(productId: number): Promise<CartLine[]> {
  const uid = await userId();
  if (!uid) return [];
  await prisma.cartItem.deleteMany({ where: { userId: uid, productId } });
  return readCart(uid);
}

export async function mergeGuestCart(lines: CartLine[]): Promise<CartLine[]> {
  const uid = await userId();
  if (!uid) return [];
  const current = await readCart(uid);
  const merged = mergeCarts(lines, current);
  await prisma.$transaction(
    merged.map((line) =>
      prisma.cartItem.upsert({
        where: { userId_productId: { userId: uid, productId: line.id } },
        update: { qty: line.qty },
        create: { userId: uid, productId: line.id, qty: line.qty },
      })
    )
  );
  return readCart(uid);
}
