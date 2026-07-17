// One-time backfill: give existing products starter tags based on their old
// type-based defaults. Skips any product that already has tags so manual
// edits are never overwritten. Safe to re-run.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TAG_MAP = {
  cctv: ["", "อินฟราเรดกลางคืน", "ดูผ่านมือถือ"], // first = resolution
  sensor: ["ไร้สาย", "แจ้งเตือนทันที"],
  alarm: ["เสียง 120dB", "ติดตั้งง่าย"],
  lock: ["สแกนลายนิ้วมือ", "ปลดล็อกผ่านแอป"],
  nvr: ["บันทึก 24 ชม.", "HDD 2TB"],
};

const products = await prisma.product.findMany();
let updated = 0;

for (const p of products) {
  if (p.tags && p.tags.length > 0) continue; // keep existing/manual tags

  const base = TAG_MAP[p.type] ?? [];
  const tags = base
    .map((t, i) => (i === 0 && p.type === "cctv" ? p.res : t))
    .filter((t) => t && t !== "-")
    .slice(0, 3);

  if (tags.length === 0) continue;

  await prisma.product.update({ where: { id: p.id }, data: { tags } });
  updated++;
}

console.log(`Backfilled tags for ${updated} product(s).`);
await prisma.$disconnect();
