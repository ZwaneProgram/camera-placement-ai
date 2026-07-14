import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PRODUCTS = [
  { id: 1, name: "กล้องโดม SUCCESS IT 4MP", en: "Dome Camera 4MP", type: "cctv", brand: "SUCCESS IT", res: "4MP", price: 1290, oldPrice: 1690, rating: 4.8, reviews: 212, ai: true },
  { id: 2, name: "กล้อง Bullet กันน้ำ 5MP", en: "Bullet Outdoor 5MP", type: "cctv", brand: "HikPro", res: "5MP", price: 1890, oldPrice: 2290, rating: 4.7, reviews: 158, ai: true },
  { id: 3, name: "กล้อง PTZ หมุน 360° 8MP", en: "PTZ 360° 8MP", type: "cctv", brand: "SUCCESS IT", res: "8MP", price: 4590, oldPrice: 5290, rating: 4.9, reviews: 97, ai: true },
  { id: 4, name: "เซ็นเซอร์ประตู-หน้าต่างไร้สาย", en: "Door/Window Sensor", type: "sensor", brand: "AjaxLite", res: "-", price: 390, oldPrice: 490, rating: 4.6, reviews: 340, ai: false },
  { id: 5, name: "เซ็นเซอร์ตรวจจับการเคลื่อนไหว PIR", en: "PIR Motion Sensor", type: "sensor", brand: "AjaxLite", res: "-", price: 590, oldPrice: 790, rating: 4.7, reviews: 221, ai: true },
  { id: 6, name: "ไซเรนสัญญาณกันขโมย 120dB", en: "Alarm Siren 120dB", type: "alarm", brand: "SUCCESS IT", res: "-", price: 890, oldPrice: 1090, rating: 4.5, reviews: 88, ai: false },
  { id: 7, name: "สมาร์ทล็อคลายนิ้วมือ", en: "Smart Fingerprint Lock", type: "lock", brand: "LockOne", res: "-", price: 3290, oldPrice: 3990, rating: 4.8, reviews: 134, ai: false },
  { id: 8, name: "ชุด NVR 8 ช่อง + HDD 2TB", en: "NVR Kit 8CH", type: "nvr", brand: "SUCCESS IT", res: "8CH", price: 5990, oldPrice: 6990, rating: 4.9, reviews: 76, ai: true },
];

async function main() {
  for (const p of PRODUCTS) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: p,
      create: p,
    });
  }

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.upsert({
      where: { email },
      update: { role: Role.ADMIN, passwordHash },
      create: { email, passwordHash, role: Role.ADMIN, name: "Admin" },
    });
    console.log(`Seeded admin: ${email}`);
  } else {
    console.warn("ADMIN_EMAIL/ADMIN_PASSWORD not set — skipped admin seed.");
  }

  // Keep the autoincrement sequence ahead of the seeded fixed IDs.
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"Product"', 'id'), (SELECT MAX(id) FROM "Product"))`
  );

  console.log(`Seeded ${PRODUCTS.length} products.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
