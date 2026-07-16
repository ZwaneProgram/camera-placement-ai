export type CartLine = { id: number; qty: number };

export function mergeCarts(guest: CartLine[], db: CartLine[]): CartLine[] {
  const byId = new Map<number, number>();
  for (const line of db) byId.set(line.id, (byId.get(line.id) ?? 0) + line.qty);
  for (const line of guest) byId.set(line.id, (byId.get(line.id) ?? 0) + line.qty);
  return [...byId.entries()].map(([id, qty]) => ({ id, qty }));
}
