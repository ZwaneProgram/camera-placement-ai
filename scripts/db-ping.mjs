// Quick runtime connectivity check against the POOLED DATABASE_URL.
// Runs the kind of query the app will run, twice, to surface any
// PgBouncer prepared-statement issues. Prints only counts, no secrets.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const a = await prisma.product.count();
  const b = await prisma.product.findMany({ take: 1 });
  const c = await prisma.user.count();
  console.log(`OK  products=${a}  sampleRows=${b.length}  users=${c}`);
  process.exit(0);
} catch (e) {
  console.error("FAIL", e?.message ?? e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
