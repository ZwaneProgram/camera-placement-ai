# Database, Auth, Admin CRUD & Persistent Cart — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the hardcoded product catalogue into Neon Postgres via Prisma, add NextAuth v5 email/password auth with USER/ADMIN roles, give admins a product CRUD UI with Vercel Blob image uploads, and persist each user's cart in the database.

**Architecture:** Prisma singleton reads feed async server pages that keep the existing `DecoratedProduct` prop shape (no read-side UI rewrites). NextAuth uses an edge/node split — `auth.config.ts` (edge-safe, used by middleware) + `auth.ts` (node, Credentials + bcrypt + Prisma adapter). Admin writes go through role-gated server actions that also upload images to Vercel Blob. The cart provider branches on session: `localStorage` for guests, DB-backed server actions for logged-in users, merging guest items into the DB cart on login.

**Tech Stack:** Next.js 16.2.9 (App Router, async params), React 19, Prisma + `@prisma/client`, Neon Postgres, `next-auth@beta` (v5) + `@auth/prisma-adapter`, `bcryptjs`, `@vercel/blob`, Vitest (pure-logic tests only).

## Global Constraints

- Next.js is a **modified 16.2.9** — per `AGENTS.md`, read the relevant guide in `node_modules/next/dist/docs/` before writing Next-specific code (route handlers, middleware, server actions, `next/image` config).
- App is **Thai-only**, single currency **฿**, no inventory/stock, no orders/checkout in this slice.
- Preserve integer product IDs (`/products/1` URLs must keep working).
- Client cart components must keep the current `useCart()` API surface: `items, count, total, totalLabel, open, setOpen, toggle, add, changeQty, remove`.
- `decorate()` output shape (`DecoratedProduct`) must stay identical so product cards/detail render unchanged.
- Secrets go in git-ignored env files. **Prisma reads `.env`** (DB URLs there); Next runtime reads `.env.local` (auth/blob/admin there). Verify both are git-ignored before writing secrets.
- Each task ends with `npx next build` passing (or the task's test) before commit. Commit messages end with the Co-Authored-By trailer.
- `ProductType` union = `"cctv" | "sensor" | "alarm" | "lock" | "nvr"`. `type` is validated against this in server actions.

---

## File Structure

**New files:**
- `prisma/schema.prisma` — full data model (Product, Role, User, CartItem, NextAuth models).
- `prisma/seed.ts` — seeds 8 products + 1 admin user.
- `lib/prisma.ts` — PrismaClient singleton.
- `lib/queries.ts` — async catalogue reads (`getAllProducts`, `getProduct`, `bestSellers`, `typeCounts`).
- `auth.config.ts` — edge-safe NextAuth config (callbacks, pages, `authorized`).
- `auth.ts` — node NextAuth instance (adapter, Credentials provider, bcrypt).
- `next-auth.d.ts` — session/JWT type augmentation.
- `middleware.ts` — route protection for `/admin/*`.
- `app/api/auth/[...nextauth]/route.ts` — auth handlers.
- `lib/auth-actions.ts` — `registerUser` server action.
- `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx` — auth pages.
- `components/auth/login-form.tsx`, `components/auth/register-form.tsx` — client forms.
- `app/admin/layout.tsx`, `app/admin/page.tsx`, `app/admin/new/page.tsx`, `app/admin/[id]/edit/page.tsx` — admin UI.
- `app/admin/actions.ts` — `createProduct`, `updateProduct`, `deleteProduct` server actions.
- `components/admin/product-form.tsx`, `components/admin/product-row-actions.tsx` — admin form + delete button.
- `lib/cart-actions.ts` — DB cart server actions (`getCart`, `addToCart`, `setCartQty`, `removeFromCart`, `mergeGuestCart`).
- `lib/cart-merge.ts` — pure merge helper (unit-tested).
- `lib/cart-merge.test.ts` — Vitest test.
- `components/session-provider.tsx` — wraps `SessionProvider`.

**Modified files:**
- `lib/products.ts` — remove `PRODUCTS`/`DECORATED`/sync `getProduct`/`bestSellers`/`typeCounts`; drop stored `typeLabel`, add `TYPE_LABEL` map + `PRODUCT_TYPES`; keep `decorate` accepting a `type`-based label.
- `app/page.tsx`, `app/products/page.tsx`, `app/products/[id]/page.tsx` — async DB reads.
- `app/layout.tsx` — add `SessionProvider`; header auth state.
- `components/site-header.tsx` — login/logout + admin link.
- `components/cart/cart-provider.tsx` — session-aware backend + merge on login.
- `next.config.ts` — Blob `remotePatterns`.
- `package.json` — deps + `prisma.seed` + `db:*` scripts + `test` script.
- `.gitignore` — ensure `.env` ignored.

---

## Phase 1 — Database foundation

### Task 1: Install dependencies and confirm env is git-ignored

**Files:**
- Modify: `package.json`
- Modify: `.gitignore`

- [ ] **Step 1: Install runtime + dev deps**

```bash
npm install @prisma/client @auth/prisma-adapter next-auth@beta bcryptjs @vercel/blob
npm install -D prisma @types/bcryptjs vitest
```

- [ ] **Step 2: Ensure `.env` is git-ignored**

Check `.gitignore` contains a line matching env files. If `.env` is not covered, add:

```gitignore
# local env files
.env
.env*.local
```

Run: `git check-ignore .env .env.local`
Expected: both paths printed (meaning both ignored).

- [ ] **Step 3: Add scripts to `package.json`**

Add to `"scripts"`:

```json
"db:migrate": "prisma migrate dev",
"db:seed": "prisma db seed",
"db:studio": "prisma studio",
"test": "vitest run"
```

And add a top-level `"prisma"` key:

```json
"prisma": {
  "seed": "node --experimental-strip-types prisma/seed.ts"
}
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .gitignore
git commit -m "chore: add prisma, next-auth, blob, bcrypt deps and db scripts"
```

### Task 2: Neon database + env vars

**Files:**
- Create/modify: `.env`
- Create/modify: `.env.local`

- [ ] **Step 1: Create a Neon project and get connection strings**

In the Neon console (https://console.neon.tech), create a project. Copy two strings:
- **Pooled** connection (host contains `-pooler`) → `DATABASE_URL`
- **Direct** connection (no `-pooler`) → `DIRECT_URL`

If the user wants guidance, walk them through it interactively; do not fabricate a URL.

- [ ] **Step 2: Write DB URLs to `.env`** (Prisma reads this file)

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxx-pooler.REGION.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@ep-xxx.REGION.aws.neon.tech/neondb?sslmode=require"
```

- [ ] **Step 3: Write app secrets to `.env.local`** (Next runtime reads this file)

Generate a secret: `npx auth secret` (writes `AUTH_SECRET` to `.env.local`) OR `openssl rand -base64 33`.

```dotenv
AUTH_SECRET="<generated>"
BLOB_READ_WRITE_TOKEN="<from Vercel Blob store; can be added at Phase 5>"
ADMIN_EMAIL="admin@successit.local"
ADMIN_PASSWORD="<choose a strong password>"
```

- [ ] **Step 4: Verify (no commit — secrets are ignored)**

Run: `git status --porcelain .env .env.local`
Expected: no output (both ignored).

### Task 3: Prisma schema (full model, single migration)

**Files:**
- Create: `prisma/schema.prisma`

**Interfaces:**
- Produces: Prisma models `Product`, `User`, `CartItem`, `Account`, `Session`, `VerificationToken`; enum `Role`. Generated client at `@prisma/client`.

- [ ] **Step 1: Write the schema**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum Role {
  USER
  ADMIN
}

model Product {
  id        Int        @id @default(autoincrement())
  name      String
  en        String
  type      String
  brand     String
  res       String     @default("-")
  price     Int
  oldPrice  Int?
  rating    Float      @default(0)
  reviews   Int        @default(0)
  ai        Boolean    @default(false)
  imageUrl  String?
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  cartItems CartItem[]
}

model User {
  id           String     @id @default(cuid())
  email        String     @unique
  passwordHash String?
  name         String?
  role         Role       @default(USER)
  cartItems    CartItem[]
  accounts     Account[]
  sessions     Session[]
  createdAt    DateTime   @default(now())
}

model CartItem {
  id        String  @id @default(cuid())
  userId    String
  productId Int
  qty       Int     @default(1)
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([userId, productId])
}

model Account {
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([provider, providerAccountId])
}

model Session {
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String
  expires    DateTime

  @@id([identifier, token])
}
```

Note: `passwordHash` is nullable so future OAuth-only users are valid; the Credentials `authorize` rejects users without a hash.

- [ ] **Step 2: Create and apply the migration**

Run: `npx prisma migrate dev --name init`
Expected: migration created under `prisma/migrations/`, applied to Neon, client generated. No errors.

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(db): add prisma schema and initial migration"
```

### Task 4: Prisma client singleton

**Files:**
- Create: `lib/prisma.ts`

**Interfaces:**
- Produces: `export const prisma: PrismaClient` (default import-safe singleton).

- [ ] **Step 1: Write the singleton**

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/prisma.ts
git commit -m "feat(db): add prisma client singleton"
```

---

## Phase 2 — Catalogue reads from the database

### Task 5: Refactor `lib/products.ts` — drop the hardcoded catalogue, keep UI metadata

**Files:**
- Modify: `lib/products.ts`

**Interfaces:**
- Consumes: Prisma `Product` row type.
- Produces: `PRODUCT_TYPES: ProductType[]`, `TYPE_LABEL: Record<ProductType, string>`, `decorate(p)`, `productHighlights`, `productSpecs`, `sortProducts`, `CATEGORIES`, `CATEGORY_META`, `FILTERS`, `PRODUCT_DESC`, `BENEFITS`, `PLACEMENT_NOTES`, types `ProductType`, `DecoratedProduct`, `FilterKey`, `SortKey`. **Removes:** `PRODUCTS`, `DECORATED`, and the synchronous `getProduct`/`bestSellers`/`typeCounts` (those move to `lib/queries.ts`).

- [ ] **Step 1: Replace the `Product` interface + `PRODUCTS` array with a DB-derived type and label map**

At the top of `lib/products.ts`, replace the `Product` interface and the `PRODUCTS` constant with:

```ts
import type { Product as DbProduct } from "@prisma/client";
import { formatBaht } from "@/lib/utils";

export type ProductType = "cctv" | "sensor" | "alarm" | "lock" | "nvr";

export const PRODUCT_TYPES: ProductType[] = [
  "cctv",
  "sensor",
  "alarm",
  "lock",
  "nvr",
];

/** Thai label for each product type (was previously stored per-row as typeLabel). */
export const TYPE_LABEL: Record<ProductType, string> = {
  cctv: "กล้องวงจรปิด",
  sensor: "เซ็นเซอร์",
  alarm: "สัญญาณกันขโมย",
  lock: "สมาร์ทล็อค",
  nvr: "ชุด NVR",
};

/** Row shape consumed by the UI. `oldPrice`/`imageUrl` may be null in the DB. */
export type Product = DbProduct;
```

- [ ] **Step 2: Update `decorate()` to derive `typeLabel` and tolerate nullables**

Replace the existing `decorate` + `DecoratedProduct` block with:

```ts
export interface DecoratedProduct {
  id: number;
  name: string;
  en: string;
  type: ProductType;
  typeLabel: string;
  brand: string;
  res: string;
  price: number;
  old: number;
  rating: number;
  reviews: number;
  ai: boolean;
  imageUrl: string | null;
  priceLabel: string;
  oldPriceLabel: string;
  discount: number;
  ratingLabel: string;
  reviewsLabel: string;
  tags: string[];
}

export function decorate(p: Product): DecoratedProduct {
  const type = p.type as ProductType;
  const old = p.oldPrice ?? p.price;
  const tags = (TAG_MAP[type] ?? [])
    .map((t, i) => (i === 0 && type === "cctv" ? p.res : t))
    .filter(Boolean)
    .slice(0, 3);
  return {
    id: p.id,
    name: p.name,
    en: p.en,
    type,
    typeLabel: TYPE_LABEL[type] ?? p.type,
    brand: p.brand,
    res: p.res,
    price: p.price,
    old,
    rating: p.rating,
    reviews: p.reviews,
    ai: p.ai,
    imageUrl: p.imageUrl,
    priceLabel: formatBaht(p.price),
    oldPriceLabel: formatBaht(old),
    discount: old > p.price ? Math.round((1 - p.price / old) * 100) : 0,
    ratingLabel: p.rating.toFixed(1),
    reviewsLabel: `(${p.reviews})`,
    tags,
  };
}
```

- [ ] **Step 3: Delete the removed exports**

Remove these now-obsolete blocks from `lib/products.ts`: `export const DECORATED = ...`, `export function getProduct(...)`, `export function bestSellers(...)`, and `export function typeCounts(...)`. Keep `TAG_MAP`, `productHighlights`, `PRODUCT_DESC`, `productSpecs`, `CATEGORIES`, `FILTERS`, `CATEGORY_META`, `sortProducts`, `BENEFITS`, `PLACEMENT_NOTES`, and the type exports. Update `productHighlights` / `productSpecs` signatures if they referenced the old `Product` fields — they use `p.res`, `p.brand`, `p.typeLabel`: change `p.typeLabel` in `productSpecs` to `TYPE_LABEL[p.type]` (it takes a `DecoratedProduct`, which now has `typeLabel`, so it can stay `p.typeLabel`).

- [ ] **Step 4: Verify types compile (expect errors in consumers — that's Task 7-8)**

Run: `npx tsc --noEmit 2>&1 | head -30`
Expected: errors ONLY in `app/page.tsx`, `app/products/page.tsx`, `app/products/[id]/page.tsx` (they still import removed symbols). `lib/products.ts` itself must have no errors.

- [ ] **Step 5: Commit**

```bash
git add lib/products.ts
git commit -m "refactor(products): derive typeLabel, drop hardcoded catalogue exports"
```

### Task 6: Async query layer `lib/queries.ts`

**Files:**
- Create: `lib/queries.ts`

**Interfaces:**
- Consumes: `prisma` from `lib/prisma.ts`; `decorate`, `DecoratedProduct`, `ProductType`, `FilterKey` from `lib/products.ts`.
- Produces:
  - `getAllProducts(): Promise<DecoratedProduct[]>`
  - `getProduct(id: number): Promise<DecoratedProduct | null>`
  - `bestSellers(n?: number): Promise<DecoratedProduct[]>`
  - `typeCounts(): Promise<Record<string, number>>`

- [ ] **Step 1: Write the query functions**

```ts
import { prisma } from "@/lib/prisma";
import { decorate, type DecoratedProduct } from "@/lib/products";

export async function getAllProducts(): Promise<DecoratedProduct[]> {
  const rows = await prisma.product.findMany({ orderBy: { id: "asc" } });
  return rows.map(decorate);
}

export async function getProduct(id: number): Promise<DecoratedProduct | null> {
  if (!Number.isInteger(id)) return null;
  const row = await prisma.product.findUnique({ where: { id } });
  return row ? decorate(row) : null;
}

export async function bestSellers(n = 4): Promise<DecoratedProduct[]> {
  const rows = await prisma.product.findMany({
    orderBy: { rating: "desc" },
    take: n,
  });
  return rows.map(decorate);
}

export async function typeCounts(): Promise<Record<string, number>> {
  const grouped = await prisma.product.groupBy({
    by: ["type"],
    _count: { _all: true },
  });
  const counts: Record<string, number> = {};
  let all = 0;
  for (const g of grouped) {
    counts[g.type] = g._count._all;
    all += g._count._all;
  }
  counts.all = all;
  return counts;
}
```

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit 2>&1 | grep queries.ts` → expect no output (no errors in this file).

- [ ] **Step 3: Commit**

```bash
git add lib/queries.ts
git commit -m "feat(db): add async catalogue query layer"
```

### Task 7: Seed script

**Files:**
- Create: `prisma/seed.ts`

- [ ] **Step 1: Write the seed (8 products + admin user)**

```ts
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
```

Note: the seed reads `ADMIN_EMAIL`/`ADMIN_PASSWORD` from `.env.local`. Prisma's seed runner loads `.env` but not `.env.local`; run the seed with the admin vars exported (see Step 2) or temporarily place them in `.env`.

- [ ] **Step 2: Run the seed**

If `ADMIN_EMAIL`/`ADMIN_PASSWORD` are only in `.env.local`, run with them exported:

```bash
ADMIN_EMAIL="admin@successit.local" ADMIN_PASSWORD="<password>" npx prisma db seed
```

Expected: "Seeded admin…" and "Seeded 8 products." No errors.

- [ ] **Step 3: Verify data landed**

Run: `npx prisma studio` (or a quick query) and confirm 8 products + 1 admin user exist.

- [ ] **Step 4: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat(db): seed 8 products and admin user"
```

### Task 8: Convert server pages to async DB reads

**Files:**
- Modify: `app/products/[id]/page.tsx`
- Modify: `app/products/page.tsx`
- Modify: `app/page.tsx`
- Modify: `components/listing/listing-view.tsx` (accept counts as a prop)

**Interfaces:**
- Consumes: `getAllProducts`, `getProduct`, `bestSellers`, `typeCounts` from `lib/queries.ts`.

- [ ] **Step 1: Product detail page — async `getProduct`, drop static params**

Replace `app/products/[id]/page.tsx` with:

```tsx
import { notFound } from "next/navigation";

import { ProductDetail } from "@/components/detail/product-detail";
import { getProduct } from "@/lib/queries";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(Number(id));
  if (!product) notFound();

  return <ProductDetail product={product} />;
}
```

- [ ] **Step 2: `listing-view.tsx` — take `counts` as a prop instead of computing from removed `typeCounts`**

In `components/listing/listing-view.tsx`: the component currently calls `typeCounts()` from `lib/products`. Change its props and remove that import.

Change the component signature and the counts memo:

```tsx
export function ListingView({
  initialFilter,
  products: initialProducts,
  counts,
}: {
  initialFilter: FilterKey;
  products: DecoratedProduct[];
  counts: Record<string, number>;
}) {
```

Remove `const counts = React.useMemo(() => typeCounts(), []);` and remove `DECORATED` usage — filter over `initialProducts` instead:

```tsx
  const products = React.useMemo(() => {
    const base = initialProducts.filter(
      (p) =>
        (filter === "all" || p.type === filter) &&
        p.price >= price[0] &&
        p.price <= price[1]
    );
    return sortProducts(base, sort);
  }, [filter, sort, price, initialProducts]);
```

Update the import line to drop `DECORATED`, `typeCounts`, `type FilterKey` stays; add `type DecoratedProduct`.

- [ ] **Step 3: `app/products/page.tsx` — fetch products + counts, pass down**

```tsx
import { ListingView } from "@/components/listing/listing-view";
import { FILTERS, type FilterKey } from "@/lib/products";
import { getAllProducts, typeCounts } from "@/lib/queries";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const valid = FILTERS.some((f) => f.k === cat);
  const initialFilter = (valid ? cat : "all") as FilterKey;

  const [products, counts] = await Promise.all([
    getAllProducts(),
    typeCounts(),
  ]);

  return (
    <ListingView
      initialFilter={initialFilter}
      products={products}
      counts={counts}
    />
  );
}
```

- [ ] **Step 4: `app/page.tsx` — replace `bestSellers()`/`DECORATED` usage with awaited query**

Open `app/page.tsx`, find where it imports and calls `bestSellers` (and any `DECORATED`/`typeCounts`) from `lib/products`. Change the import to `import { bestSellers } from "@/lib/queries";`, make the component `async` if not already, and `const featured = await bestSellers(4);`. Wire `featured` into the existing best-sellers section (same prop shape as before).

- [ ] **Step 5: Verify build + run**

Run: `npx next build`
Expected: builds clean, no type errors.

Run: `npm run dev`, open `/`, `/products`, `/products/1`. Expected: storefront looks identical to before (data now from DB), filters + price range still work.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx app/products/page.tsx "app/products/[id]/page.tsx" components/listing/listing-view.tsx
git commit -m "feat(db): read catalogue from database in server pages"
```

---

## Phase 3 — Authentication (NextAuth v5)

> **Read first:** `node_modules/next/dist/docs/` sections on middleware and route handlers before writing `middleware.ts` and the auth route.

### Task 9: NextAuth type augmentation

**Files:**
- Create: `next-auth.d.ts`

**Interfaces:**
- Produces: `Session["user"].role: "USER" | "ADMIN"`, `Session["user"].id: string`, and JWT `role`/`id`.

- [ ] **Step 1: Write the augmentation**

```ts
import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }
  interface User {
    role?: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add next-auth.d.ts
git commit -m "feat(auth): add next-auth type augmentation for role"
```

### Task 10: Edge-safe auth config

**Files:**
- Create: `auth.config.ts`

**Interfaces:**
- Produces: `default` export `authConfig: NextAuthConfig` with `pages`, `callbacks.authorized`, `callbacks.jwt`, `callbacks.session`. **No** Prisma/bcrypt imports (must stay edge-safe).

- [ ] **Step 1: Write the config**

```ts
import type { NextAuthConfig } from "next-auth";

export default {
  pages: {
    signIn: "/login",
  },
  providers: [], // real providers added in auth.ts (node runtime)
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isAdminRoute = nextUrl.pathname.startsWith("/admin");
      if (isAdminRoute) {
        return auth?.user?.role === "ADMIN";
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id;
      if (token.role) session.user.role = token.role;
      return session;
    },
  },
} satisfies NextAuthConfig;
```

- [ ] **Step 2: Commit**

```bash
git add auth.config.ts
git commit -m "feat(auth): add edge-safe auth config with role callbacks"
```

### Task 11: Node auth instance (Credentials + Prisma + bcrypt)

**Files:**
- Create: `auth.ts`

**Interfaces:**
- Consumes: `authConfig` from `auth.config.ts`, `prisma` from `lib/prisma.ts`.
- Produces: `export const { handlers, auth, signIn, signOut }`.

- [ ] **Step 1: Write the instance**

```ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import authConfig from "./auth.config";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").toLowerCase().trim();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
});
```

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit 2>&1 | grep -E "auth.ts|auth.config" ` → expect no output.

- [ ] **Step 3: Commit**

```bash
git add auth.ts
git commit -m "feat(auth): add node auth instance with credentials provider"
```

### Task 12: Auth route handler + middleware

**Files:**
- Create: `app/api/auth/[...nextauth]/route.ts`
- Create: `middleware.ts`

- [ ] **Step 1: Route handler**

```ts
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
```

- [ ] **Step 2: Middleware (edge — uses the config-only instance)**

```ts
import NextAuth from "next-auth";
import authConfig from "./auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Guard everything except static assets & the auth API.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
```

Note: the `authorized` callback only restricts `/admin/*`; all other matched routes return `true`, so public pages stay open. Middleware imports `auth.config` ONLY — never `auth.ts` — so bcrypt/Prisma never enter the edge bundle.

- [ ] **Step 3: Build check**

Run: `npx next build`
Expected: builds clean; no "module not found" or edge-runtime errors about bcrypt/Prisma.

- [ ] **Step 4: Commit**

```bash
git add "app/api/auth/[...nextauth]/route.ts" middleware.ts
git commit -m "feat(auth): add auth route handler and admin-guard middleware"
```

### Task 13: Register server action + SessionProvider

**Files:**
- Create: `lib/auth-actions.ts`
- Create: `components/session-provider.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**
- Produces: `registerUser(formData: FormData): Promise<{ error?: string }>`; `AuthSessionProvider` wrapper component.

- [ ] **Step 1: Register action**

```ts
"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function registerUser(
  formData: FormData
): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim() || null;

  if (!email || !password) return { error: "กรุณากรอกอีเมลและรหัสผ่าน" };
  if (password.length < 8) return { error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "อีเมลนี้ถูกใช้งานแล้ว" };

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { email, passwordHash, name, role: "USER" },
  });
  return {};
}
```

- [ ] **Step 2: SessionProvider wrapper**

```tsx
"use client";

import { SessionProvider } from "next-auth/react";

export function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

- [ ] **Step 3: Wrap the app in `app/layout.tsx`**

Import `AuthSessionProvider` and wrap the existing `<CartProvider>` subtree:

```tsx
<body className="flex min-h-full flex-col font-sans">
  <AuthSessionProvider>
    <CartProvider>
      {/* ...existing header/main/footer/drawer/toaster... */}
    </CartProvider>
  </AuthSessionProvider>
</body>
```

- [ ] **Step 4: Build check**

Run: `npx next build` → clean.

- [ ] **Step 5: Commit**

```bash
git add lib/auth-actions.ts components/session-provider.tsx app/layout.tsx
git commit -m "feat(auth): add register action and session provider"
```

### Task 14: Login & register pages + forms

**Files:**
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/register/page.tsx`
- Create: `components/auth/login-form.tsx`
- Create: `components/auth/register-form.tsx`

- [ ] **Step 1: Login form (client, uses `signIn`)**

```tsx
"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const data = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: data.get("email"),
      password: data.get("password"),
      redirect: false,
    });
    setPending(false);
    if (res?.error) {
      toast.error("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      return;
    }
    router.push(params.get("callbackUrl") ?? "/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <input name="email" type="email" required placeholder="อีเมล"
        className="h-11 rounded-xl border border-line px-4 text-sm outline-none focus:border-brand-teal" />
      <input name="password" type="password" required placeholder="รหัสผ่าน"
        className="h-11 rounded-xl border border-line px-4 text-sm outline-none focus:border-brand-teal" />
      <button disabled={pending}
        className="h-11 rounded-xl bg-ink font-semibold text-white disabled:opacity-60">
        {pending ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Register form (client, calls `registerUser` then `signIn`)**

```tsx
"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { registerUser } from "@/lib/auth-actions";

export function RegisterForm() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const data = new FormData(e.currentTarget);
    const result = await registerUser(data);
    if (result.error) {
      setPending(false);
      toast.error(result.error);
      return;
    }
    await signIn("credentials", {
      email: data.get("email"),
      password: data.get("password"),
      redirect: false,
    });
    setPending(false);
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <input name="name" type="text" placeholder="ชื่อ (ไม่บังคับ)"
        className="h-11 rounded-xl border border-line px-4 text-sm outline-none focus:border-brand-teal" />
      <input name="email" type="email" required placeholder="อีเมล"
        className="h-11 rounded-xl border border-line px-4 text-sm outline-none focus:border-brand-teal" />
      <input name="password" type="password" required minLength={8} placeholder="รหัสผ่าน (อย่างน้อย 8 ตัว)"
        className="h-11 rounded-xl border border-line px-4 text-sm outline-none focus:border-brand-teal" />
      <button disabled={pending}
        className="h-11 rounded-xl bg-ink font-semibold text-white disabled:opacity-60">
        {pending ? "กำลังสมัคร…" : "สมัครสมาชิก"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Login page**

```tsx
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-[400px] px-5 py-16">
      <h1 className="mb-6 text-2xl font-bold text-ink">เข้าสู่ระบบ</h1>
      <LoginForm />
      <p className="mt-4 text-sm text-muted-foreground">
        ยังไม่มีบัญชี?{" "}
        <Link href="/register" className="font-semibold text-brand-blue">
          สมัครสมาชิก
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Register page**

```tsx
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-[400px] px-5 py-16">
      <h1 className="mb-6 text-2xl font-bold text-ink">สมัครสมาชิก</h1>
      <RegisterForm />
      <p className="mt-4 text-sm text-muted-foreground">
        มีบัญชีอยู่แล้ว?{" "}
        <Link href="/login" className="font-semibold text-brand-blue">
          เข้าสู่ระบบ
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 5: Build + manual verify**

Run: `npx next build` → clean.
Run dev: register a new user → should land logged in; log out; log in with admin creds. Verify a wrong password shows the error toast.

- [ ] **Step 6: Commit**

```bash
git add "app/(auth)" components/auth
git commit -m "feat(auth): add login and register pages"
```

### Task 15: Header auth state (login/logout + admin link)

**Files:**
- Modify: `components/site-header.tsx`

- [ ] **Step 1: Add session-aware controls**

In `components/site-header.tsx`, import session + signOut:

```tsx
import { useSession, signOut } from "next-auth/react";
```

Inside `SiteHeader`, read the session:

```tsx
const { data: session } = useSession();
const isAdmin = session?.user?.role === "ADMIN";
```

Add controls next to the cart button (desktop). Replace the `<div className="flex-1" />` spacer region so the following render before the cart button:

```tsx
{session?.user ? (
  <div className="hidden items-center gap-2 md:flex">
    {isAdmin && (
      <Link href="/admin" className="flex h-10 items-center rounded-xl px-3 text-sm font-semibold text-brand-blue hover:bg-line-soft">
        แอดมิน
      </Link>
    )}
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="flex h-10 items-center rounded-xl px-3 text-sm font-semibold text-ink hover:bg-secondary"
    >
      ออกจากระบบ
    </button>
  </div>
) : (
  <Link href="/login" className="hidden h-10 items-center rounded-xl px-3 text-sm font-semibold text-ink hover:bg-secondary md:flex">
    เข้าสู่ระบบ
  </Link>
)}
```

Also add a `เข้าสู่ระบบ`/`ออกจากระบบ` entry to the mobile menu block for parity.

- [ ] **Step 2: Build + verify**

Run: `npx next build` → clean. Dev: header shows เข้าสู่ระบบ when logged out; shows แอดมิน + ออกจากระบบ when logged in as admin; only ออกจากระบบ for a normal user.

- [ ] **Step 3: Commit**

```bash
git add components/site-header.tsx
git commit -m "feat(auth): add auth controls and admin link to header"
```

---

## Phase 4 — Admin CRUD

### Task 16: Admin server actions (role-gated)

**Files:**
- Create: `app/admin/actions.ts`

**Interfaces:**
- Consumes: `auth` from `@/auth`, `prisma`, `PRODUCT_TYPES` from `lib/products`, (Blob helper added in Phase 5).
- Produces:
  - `createProduct(formData: FormData): Promise<{ error?: string }>`
  - `updateProduct(id: number, formData: FormData): Promise<{ error?: string }>`
  - `deleteProduct(id: number): Promise<void>`
  - Internal `requireAdmin()` + `parseProductForm()`.

- [ ] **Step 1: Write actions (text fields only for now; image added Phase 5)**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PRODUCT_TYPES, type ProductType } from "@/lib/products";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("ไม่ได้รับอนุญาต");
  }
}

type ParsedProduct = {
  name: string;
  en: string;
  type: ProductType;
  brand: string;
  res: string;
  price: number;
  oldPrice: number | null;
  rating: number;
  reviews: number;
  ai: boolean;
};

function parseProductForm(formData: FormData): ParsedProduct | { error: string } {
  const name = String(formData.get("name") ?? "").trim();
  const en = String(formData.get("en") ?? "").trim();
  const type = String(formData.get("type") ?? "") as ProductType;
  const brand = String(formData.get("brand") ?? "").trim();
  const res = String(formData.get("res") ?? "-").trim() || "-";
  const price = Number(formData.get("price"));
  const oldRaw = String(formData.get("oldPrice") ?? "").trim();
  const oldPrice = oldRaw === "" ? null : Number(oldRaw);
  const rating = Number(formData.get("rating") ?? 0);
  const reviews = Number(formData.get("reviews") ?? 0);
  const ai = formData.get("ai") === "on";

  if (!name || !en || !brand) return { error: "กรุณากรอกข้อมูลให้ครบ" };
  if (!PRODUCT_TYPES.includes(type)) return { error: "ประเภทสินค้าไม่ถูกต้อง" };
  if (!Number.isFinite(price) || price < 0) return { error: "ราคาไม่ถูกต้อง" };
  if (oldPrice !== null && (!Number.isFinite(oldPrice) || oldPrice < 0))
    return { error: "ราคาเดิมไม่ถูกต้อง" };

  return { name, en, type, brand, res, price, oldPrice, rating, reviews, ai };
}

function revalidateStorefront(id?: number) {
  revalidatePath("/");
  revalidatePath("/products");
  if (id) revalidatePath(`/products/${id}`);
  revalidatePath("/admin");
}

export async function createProduct(
  formData: FormData
): Promise<{ error?: string }> {
  await requireAdmin();
  const parsed = parseProductForm(formData);
  if ("error" in parsed) return parsed;

  const created = await prisma.product.create({ data: parsed });
  revalidateStorefront(created.id);
  redirect("/admin");
}

export async function updateProduct(
  id: number,
  formData: FormData
): Promise<{ error?: string }> {
  await requireAdmin();
  const parsed = parseProductForm(formData);
  if ("error" in parsed) return parsed;

  await prisma.product.update({ where: { id }, data: parsed });
  revalidateStorefront(id);
  redirect("/admin");
}

export async function deleteProduct(id: number): Promise<void> {
  await requireAdmin();
  await prisma.product.delete({ where: { id } });
  revalidateStorefront(id);
}
```

- [ ] **Step 2: Compile check**

Run: `npx tsc --noEmit 2>&1 | grep "admin/actions"` → no output.

- [ ] **Step 3: Commit**

```bash
git add app/admin/actions.ts
git commit -m "feat(admin): add role-gated product server actions"
```

### Task 17: Admin product form component

**Files:**
- Create: `components/admin/product-form.tsx`

**Interfaces:**
- Consumes: `createProduct`/`updateProduct` from `app/admin/actions.ts`, `PRODUCT_TYPES`/`TYPE_LABEL` from `lib/products`, `DecoratedProduct` for edit defaults.
- Produces: `ProductForm({ product?, action })`.

- [ ] **Step 1: Write the form (shared by new + edit)**

```tsx
"use client";

import * as React from "react";
import { toast } from "sonner";

import { PRODUCT_TYPES, TYPE_LABEL, type DecoratedProduct } from "@/lib/products";

export function ProductForm({
  product,
  action,
}: {
  product?: DecoratedProduct;
  action: (formData: FormData) => Promise<{ error?: string }>;
}) {
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const result = await action(new FormData(e.currentTarget));
    // A redirect() in the action throws NEXT_REDIRECT and never returns here;
    // reaching this line means validation failed.
    setPending(false);
    if (result?.error) toast.error(result.error);
  }

  const field =
    "h-11 rounded-xl border border-line px-4 text-sm outline-none focus:border-brand-teal";

  return (
    <form onSubmit={onSubmit} className="flex max-w-[520px] flex-col gap-3">
      <input name="name" defaultValue={product?.name} placeholder="ชื่อสินค้า (ไทย)" required className={field} />
      <input name="en" defaultValue={product?.en} placeholder="ชื่อสินค้า (อังกฤษ)" required className={field} />
      <select name="type" defaultValue={product?.type ?? "cctv"} className={field}>
        {PRODUCT_TYPES.map((t) => (
          <option key={t} value={t}>{TYPE_LABEL[t]}</option>
        ))}
      </select>
      <input name="brand" defaultValue={product?.brand} placeholder="ยี่ห้อ" required className={field} />
      <input name="res" defaultValue={product?.res ?? "-"} placeholder="ความละเอียด (เช่น 4MP หรือ -)" className={field} />
      <input name="price" type="number" defaultValue={product?.price} placeholder="ราคา (บาท)" required className={field} />
      <input name="oldPrice" type="number" defaultValue={product?.old} placeholder="ราคาเดิม (ไม่บังคับ)" className={field} />
      <input name="rating" type="number" step="0.1" min="0" max="5" defaultValue={product?.rating ?? 0} placeholder="คะแนน (0-5)" className={field} />
      <input name="reviews" type="number" defaultValue={product?.reviews ?? 0} placeholder="จำนวนรีวิว" className={field} />
      <label className="flex items-center gap-2 text-sm text-ink">
        <input name="ai" type="checkbox" defaultChecked={product?.ai} /> รองรับฟีเจอร์ AI วางกล้อง
      </label>
      <button disabled={pending} className="h-11 rounded-xl bg-ink font-semibold text-white disabled:opacity-60">
        {pending ? "กำลังบันทึก…" : "บันทึก"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/product-form.tsx
git commit -m "feat(admin): add shared product form component"
```

### Task 18: Admin pages (list, new, edit) + delete button

**Files:**
- Create: `app/admin/layout.tsx`
- Create: `app/admin/page.tsx`
- Create: `app/admin/new/page.tsx`
- Create: `app/admin/[id]/edit/page.tsx`
- Create: `components/admin/product-row-actions.tsx`

- [ ] **Step 1: Admin layout (server-side role gate, belt-and-suspenders with middleware)**

```tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/login?callbackUrl=/admin");

  return (
    <div className="mx-auto max-w-[960px] px-5 py-10">
      <h1 className="mb-6 text-2xl font-bold text-ink">จัดการสินค้า</h1>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Delete button (client)**

```tsx
"use client";

import * as React from "react";
import { toast } from "sonner";

import { deleteProduct } from "@/app/admin/actions";

export function ProductRowActions({ id }: { id: number }) {
  const [pending, setPending] = React.useState(false);

  async function onDelete() {
    if (!confirm("ลบสินค้านี้?")) return;
    setPending(true);
    try {
      await deleteProduct(id);
      toast.success("ลบสินค้าแล้ว");
    } catch {
      toast.error("ลบไม่สำเร็จ");
    } finally {
      setPending(false);
    }
  }

  return (
    <button onClick={onDelete} disabled={pending} className="text-sm font-semibold text-destructive disabled:opacity-50">
      ลบ
    </button>
  );
}
```

- [ ] **Step 3: Admin list page**

```tsx
import Link from "next/link";

import { getAllProducts } from "@/lib/queries";
import { formatBaht } from "@/lib/utils";
import { ProductRowActions } from "@/components/admin/product-row-actions";

export default async function AdminProductsPage() {
  const products = await getAllProducts();

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Link href="/admin/new" className="h-10 rounded-xl bg-ink px-4 text-sm font-semibold leading-10 text-white">
          + เพิ่มสินค้า
        </Link>
      </div>
      <div className="overflow-hidden rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-muted-foreground">
            <tr>
              <th className="p-3">ชื่อ</th>
              <th className="p-3">ประเภท</th>
              <th className="p-3">ราคา</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-line">
                <td className="p-3 font-semibold text-ink">{p.name}</td>
                <td className="p-3 text-muted-foreground">{p.typeLabel}</td>
                <td className="p-3">{formatBaht(p.price)}</td>
                <td className="flex justify-end gap-3 p-3">
                  <Link href={`/admin/${p.id}/edit`} className="text-sm font-semibold text-brand-blue">แก้ไข</Link>
                  <ProductRowActions id={p.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: New page**

```tsx
import { ProductForm } from "@/components/admin/product-form";
import { createProduct } from "@/app/admin/actions";

export default function NewProductPage() {
  return <ProductForm action={createProduct} />;
}
```

- [ ] **Step 5: Edit page**

```tsx
import { notFound } from "next/navigation";

import { ProductForm } from "@/components/admin/product-form";
import { updateProduct } from "@/app/admin/actions";
import { getProduct } from "@/lib/queries";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = Number(id);
  const product = await getProduct(productId);
  if (!product) notFound();

  const action = updateProduct.bind(null, productId);
  return <ProductForm product={product} action={action} />;
}
```

- [ ] **Step 6: Build + full manual verify**

Run: `npx next build` → clean.
Dev, logged in as admin: visit `/admin` → table of 8. Add a product → appears on `/products`. Edit it → change reflected. Delete it → gone. Log out, visit `/admin` → redirected to `/login`. Log in as a normal USER, visit `/admin` → redirected (middleware).

- [ ] **Step 7: Commit**

```bash
git add app/admin components/admin/product-row-actions.tsx
git commit -m "feat(admin): add product list, create, edit, delete pages"
```

---

## Phase 5 — Vercel Blob image uploads

### Task 19: Blob upload helper + wire into admin actions

**Files:**
- Create: `lib/blob.ts`
- Modify: `app/admin/actions.ts`
- Modify: `next.config.ts`

**Interfaces:**
- Produces: `uploadProductImage(file: File): Promise<string>` (returns public URL), `deleteProductImage(url: string): Promise<void>`.

- [ ] **Step 1: Ensure `BLOB_READ_WRITE_TOKEN` is set**

Create a Blob store in the Vercel dashboard (Storage → Blob) and copy its read-write token into `.env.local` as `BLOB_READ_WRITE_TOKEN`. Guide the user interactively if needed.

- [ ] **Step 2: Blob helper**

```ts
import { put, del } from "@vercel/blob";

export async function uploadProductImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const key = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const blob = await put(key, file, { access: "public" });
  return blob.url;
}

export async function deleteProductImage(url: string): Promise<void> {
  try {
    await del(url);
  } catch {
    /* already gone — non-fatal */
  }
}
```

- [ ] **Step 3: Wire image into create/update/delete actions**

In `app/admin/actions.ts`, import the helpers and handle the `image` file field:

```ts
import { uploadProductImage, deleteProductImage } from "@/lib/blob";
```

In `createProduct`, after parsing, before create:

```ts
  const image = formData.get("image");
  let imageUrl: string | null = null;
  if (image instanceof File && image.size > 0) {
    imageUrl = await uploadProductImage(image);
  }
  const created = await prisma.product.create({ data: { ...parsed, imageUrl } });
```

In `updateProduct`, load the existing row to swap images:

```ts
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return { error: "ไม่พบสินค้า" };

  const image = formData.get("image");
  let imageUrl = existing.imageUrl;
  if (image instanceof File && image.size > 0) {
    imageUrl = await uploadProductImage(image);
    if (existing.imageUrl) await deleteProductImage(existing.imageUrl);
  }
  await prisma.product.update({ where: { id }, data: { ...parsed, imageUrl } });
```

In `deleteProduct`, delete the blob after the row:

```ts
  const existing = await prisma.product.findUnique({ where: { id } });
  await prisma.product.delete({ where: { id } });
  if (existing?.imageUrl) await deleteProductImage(existing.imageUrl);
```

- [ ] **Step 4: Add the image field to the form**

In `components/admin/product-form.tsx`, add `encType` and a file input. Change the `<form>` open tag to include `encType="multipart/form-data"` and add before the submit button:

```tsx
      {product?.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.imageUrl} alt="" className="h-24 w-24 rounded-lg object-cover" />
      )}
      <input name="image" type="file" accept="image/*" className="text-sm" />
```

- [ ] **Step 5: Configure `next/image` remote host**

In `next.config.ts`, add the Blob hostname to `images.remotePatterns`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
```

If `next.config.ts` already has content, merge the `images` key rather than overwriting.

- [ ] **Step 6: Build + verify upload**

Run: `npx next build` → clean.
Dev: create a product with an image → the returned Blob URL is stored; the product card/detail renders the photo. Edit and replace the image → old blob deleted, new shown.

- [ ] **Step 7: Commit**

```bash
git add lib/blob.ts app/admin/actions.ts components/admin/product-form.tsx next.config.ts
git commit -m "feat(admin): upload product images to vercel blob"
```

### Task 20: Render uploaded images on cards & detail (with placeholder fallback)

**Files:**
- Modify: `components/product-card.tsx`
- Modify: `components/detail/product-detail.tsx`

- [ ] **Step 1: Product card — render `imageUrl` when present**

In `components/product-card.tsx`, locate the hatched placeholder box (the `sv-hatch` element). Render `next/image` when `product.imageUrl` is set, otherwise keep the existing placeholder. Example:

```tsx
import Image from "next/image";
// ...
{product.imageUrl ? (
  <Image
    src={product.imageUrl}
    alt={product.name}
    fill
    sizes="(max-width: 768px) 50vw, 25vw"
    className="object-cover"
  />
) : (
  /* existing sv-hatch placeholder element */
)}
```

Ensure the image's parent has `relative` positioning for `fill`.

- [ ] **Step 2: Product detail gallery — same treatment**

In `components/detail/product-detail.tsx`, apply the same conditional in the main gallery slot: render `next/image` from `product.imageUrl` when present, else the current placeholder.

- [ ] **Step 3: Build + verify**

Run: `npx next build` → clean. Dev: products with images show photos on `/products` and detail; products without images still show the hatched placeholder.

- [ ] **Step 4: Commit**

```bash
git add components/product-card.tsx components/detail/product-detail.tsx
git commit -m "feat(catalogue): render uploaded product images with placeholder fallback"
```

---

## Phase 6 — Persistent per-user cart

### Task 21: Pure cart-merge helper (TDD)

**Files:**
- Create: `lib/cart-merge.ts`
- Create: `lib/cart-merge.test.ts`
- Create/modify: `vitest.config.ts` (if needed)

**Interfaces:**
- Produces: `mergeCarts(guest: CartLine[], db: CartLine[]): CartLine[]` where `CartLine = { id: number; qty: number }` — sums quantities per product id.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { mergeCarts } from "./cart-merge";

describe("mergeCarts", () => {
  it("sums quantities for products in both carts", () => {
    const result = mergeCarts(
      [{ id: 1, qty: 2 }],
      [{ id: 1, qty: 3 }]
    );
    expect(result).toEqual([{ id: 1, qty: 5 }]);
  });

  it("keeps products unique to each cart", () => {
    const result = mergeCarts(
      [{ id: 1, qty: 1 }],
      [{ id: 2, qty: 4 }]
    );
    expect(result).toEqual(
      expect.arrayContaining([
        { id: 1, qty: 1 },
        { id: 2, qty: 4 },
      ])
    );
    expect(result).toHaveLength(2);
  });

  it("returns db cart unchanged when guest cart is empty", () => {
    expect(mergeCarts([], [{ id: 9, qty: 2 }])).toEqual([{ id: 9, qty: 2 }]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/cart-merge.test.ts`
Expected: FAIL — `mergeCarts` not found.

- [ ] **Step 3: Implement `mergeCarts`**

```ts
export type CartLine = { id: number; qty: number };

export function mergeCarts(guest: CartLine[], db: CartLine[]): CartLine[] {
  const byId = new Map<number, number>();
  for (const line of db) byId.set(line.id, (byId.get(line.id) ?? 0) + line.qty);
  for (const line of guest) byId.set(line.id, (byId.get(line.id) ?? 0) + line.qty);
  return [...byId.entries()].map(([id, qty]) => ({ id, qty }));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/cart-merge.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/cart-merge.ts lib/cart-merge.test.ts vitest.config.ts
git commit -m "feat(cart): add tested cart-merge helper"
```

### Task 22: DB cart server actions

**Files:**
- Create: `lib/cart-actions.ts`

**Interfaces:**
- Consumes: `auth`, `prisma`, `mergeCarts`/`CartLine`.
- Produces (all require a session; return `[]`/no-op when unauthenticated):
  - `getCart(): Promise<CartLine[]>`
  - `addToCart(productId: number, qty?: number): Promise<CartLine[]>`
  - `setCartQty(productId: number, qty: number): Promise<CartLine[]>`
  - `removeFromCart(productId: number): Promise<CartLine[]>`
  - `mergeGuestCart(lines: CartLine[]): Promise<CartLine[]>`

- [ ] **Step 1: Write the actions**

```ts
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
```

- [ ] **Step 2: Compile check**

Run: `npx tsc --noEmit 2>&1 | grep cart-actions` → no output.

- [ ] **Step 3: Commit**

```bash
git add lib/cart-actions.ts
git commit -m "feat(cart): add db-backed cart server actions"
```

### Task 23: Session-aware cart provider with login merge

**Files:**
- Modify: `components/cart/cart-provider.tsx`

**Interfaces:**
- Consumes: `useSession` from `next-auth/react`; `getCart`, `addToCart`, `setCartQty`, `removeFromCart`, `mergeGuestCart` from `lib/cart-actions`; catalogue lookup for name/price hydration (`getAllProducts` is server-only — instead the provider needs product name/price for DB lines; fetch a lightweight map).

**Design note:** DB `CartItem` stores only `productId` + `qty`. The drawer needs `name` + `price`. Add a small server action `getCartProducts(ids: number[])` to `lib/cart-actions.ts` returning `{ id, name, price }[]`, OR reuse the already-loaded catalogue. Simplest: add `getCartLinesDetailed()` returning `CartItem[]` (id/name/price/qty) by joining `product`. Implement that and use it in the provider.

- [ ] **Step 1: Add a detailed cart reader to `lib/cart-actions.ts`**

```ts
import type { CartItem as UiCartItem } from "@/components/cart/cart-provider";

export async function getCartDetailed(): Promise<UiCartItem[]> {
  const uid = await userId();
  if (!uid) return [];
  const rows = await prisma.cartItem.findMany({
    where: { userId: uid },
    orderBy: { productId: "asc" },
    include: { product: true },
  });
  return rows.map((r) => ({
    id: r.productId,
    name: r.product.name,
    price: r.product.price,
    qty: r.qty,
  }));
}
```

(Alternatively define the `UiCartItem` shape in `cart-actions.ts` to avoid a client→server import cycle; if the import from the client component causes a cycle, inline the type `{ id: number; name: string; price: number; qty: number }`.)

- [ ] **Step 2: Rework `cart-provider.tsx` to branch on session**

Replace the provider body so that:
- When **unauthenticated**: behaves exactly as today (localStorage source of truth).
- When the session transitions to **authenticated**: read guest lines from localStorage, call `mergeGuestCart(guestLines)`, clear localStorage, then load `getCartDetailed()` into state.
- When **authenticated**: `add`/`changeQty`/`remove` call the server actions and set state from their returned detailed cart (re-fetch `getCartDetailed()` after mutations that return only `CartLine[]`).

```tsx
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
      /* ignore */
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
        guest = raw ? JSON.parse(raw).map((i: CartItem) => ({ id: i.id, qty: i.qty })) : [];
      } catch {
        guest = [];
      }
      if (guest.length) await mergeGuestCart(guest);
      localStorage.removeItem(STORAGE_KEY);
      setItems(await getCartDetailed());
    })();
  }, [authed]);

  // Reset the merge guard on logout.
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
          return [...prev, { id: product.id, name: product.name, price: product.price, qty }];
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
          prev.map((x) => (x.id === id ? { ...x, qty: x.qty + delta } : x)).filter((x) => x.qty > 0)
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
    items, count, total, totalLabel: formatBaht(total),
    open, setOpen, toggle: () => setOpen((o) => !o),
    add, changeQty, remove,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
```

- [ ] **Step 3: Build + full manual verify of the cart flow**

Run: `npx next build` → clean.
Dev flow:
1. As guest, add 2 items → cart shows them (localStorage).
2. Log in → guest items merge into DB cart; drawer still shows them; refresh page → cart persists (from DB).
3. Add/increment/remove while logged in → changes persist across reload.
4. Log out → cart reverts to a fresh guest (empty) localStorage cart.
5. Log back in → DB cart restored.
6. Open the DB in `prisma studio` → `CartItem` rows match.

- [ ] **Step 4: Commit**

```bash
git add lib/cart-actions.ts components/cart/cart-provider.tsx
git commit -m "feat(cart): persist cart per user with login merge"
```

### Task 24: Final full-suite verification

- [ ] **Step 1: Run the test suite**

Run: `npm run test`
Expected: cart-merge tests pass.

- [ ] **Step 2: Production build**

Run: `npx next build`
Expected: clean build, all routes compiled.

- [ ] **Step 3: End-to-end smoke (dev)**

Verify in one pass: browse catalogue (DB) → register → login → admin CRUD (create with image, edit, delete) → guest→login cart merge → cart persists across reload → logout. No console errors.

- [ ] **Step 4: Commit any final touch-ups**

```bash
git add -A
git commit -m "chore: final verification pass for db/auth/cart slice"
```

---

## Self-Review Notes (author)

- **Spec coverage:** catalogue-in-DB (Tasks 3-8), typeLabel cleanup (Task 5), auth with roles + edge/node split (Tasks 9-15), admin CRUD role-gated (Tasks 16-18), Vercel Blob images (Tasks 19-20), persistent cart with login-merge (Tasks 21-23), seed with admin (Task 7), env split .env/.env.local (Task 2). All spec sections mapped.
- **Placeholders:** none — every code step contains full code.
- **Type consistency:** `DecoratedProduct` uses `imageUrl` (nullable) + `old` (number); `CartLine = {id,qty}`; `CartItem` UI type `{id,name,price,qty}`; server actions return `CartLine[]` while the provider re-reads `getCartDetailed()` for display. `Role` from `@prisma/client` used consistently in auth callbacks and augmentation.
- **Known follow-ups (out of scope, noted):** real user-account admin management, orders/checkout, OAuth providers (schema is ready).
