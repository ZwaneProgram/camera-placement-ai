# Design: Real Database — Catalogue, Auth, Admin CRUD & Persistent Cart

**Date:** 2026-07-14
**Project:** SUCCESS IT (ai-ecommerce)
**Status:** Approved design — ready for implementation planning

## Goal

Replace the hardcoded product catalogue with a real Postgres database, add
email/password authentication with `USER` / `ADMIN` roles, give admins a CRUD UI
for products (with real image uploads), and persist each user's cart in the
database. Ship it as one coherent slice.

## Non-goals (this slice)

- No checkout / orders / payments.
- No email verification, password reset, or OAuth (Google/LINE) — but the schema
  is left OAuth-ready so it can be added later without a migration rewrite.
- No inventory / stock tracking. Single currency (฿). Thai-only UI.
- The AI placement simulator and its API routes are untouched.

## Stack additions

- **Neon** (serverless Postgres) as the database.
- **Prisma** ORM (`prisma`, `@prisma/client`).
- **NextAuth v5 / Auth.js** (`next-auth@beta`, `@auth/prisma-adapter`) for auth.
- **bcryptjs** for password hashing (pure JS — avoids native build issues on Windows).
- **@vercel/blob** for product image uploads.

## Architecture

```
Neon Postgres ──Prisma──> lib/queries.ts (async reads) ──> server pages ──props──> client components
      ▲                          │
      │            admin server actions (create/update/delete) ──put()──> Vercel Blob
      │
   NextAuth (auth.ts, node runtime) ── JWT session {id, role}
      │
   middleware.ts (edge, auth.config.ts) ── guards /admin/* by role
```

### What moves vs. stays

- **Moves to DB:** the 8-product catalogue (today's `PRODUCTS` array in `lib/products.ts`).
- **Stays in code (`lib/products.ts`):** pure UI metadata and shaping —
  `decorate()`, `CATEGORIES`, `CATEGORY_META`, `FILTERS`, `TAG_MAP`,
  `productSpecs()`, `productHighlights()`, `sortProducts()`, and the type/label
  maps. These are keyed by `type`, not data. `PRODUCTS`/`DECORATED` constants and
  the synchronous `getProduct`/`bestSellers` are removed (moved to `lib/queries.ts`).
- **New `lib/queries.ts`:** async Prisma reads — `getAllProducts()`,
  `getProduct(id)`, `bestSellers(n)`. Each applies the existing `decorate()`
  shaping so client components receive the same `DecoratedProduct` prop shape
  they do today (no UI component rewrites for reads).
- **Cleanup:** the stored `typeLabel` field is dropped; label is derived from
  `type` via a `TYPE_LABEL` map in `lib/products.ts`. One fewer admin field, no
  drift between `type` and its label.

### Rendering & revalidation

- Server pages (`app/page.tsx`, `app/products/page.tsx`,
  `app/products/[id]/page.tsx`) become `async` and `await` `lib/queries.ts`.
- `generateStaticParams` for product detail is replaced with dynamic rendering
  (DB-backed). Admin mutations call `revalidatePath()` for `/`, `/products`, and
  the affected `/products/[id]` so the storefront reflects changes immediately.

## Data model (Prisma schema)

```prisma
enum Role { USER ADMIN }

model Product {
  id        Int        @id @default(autoincrement())  // preserves /products/1 URLs
  name      String                                     // Thai name
  en        String
  type      String                                     // "cctv"|"sensor"|"alarm"|"lock"|"nvr" (app-validated)
  brand     String
  res       String     @default("-")
  price     Int
  oldPrice  Int?                                       // strike-through original price
  rating    Float      @default(0)
  reviews   Int        @default(0)
  ai        Boolean    @default(false)
  imageUrl  String?                                    // Vercel Blob URL; null -> hatched placeholder
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  cartItems CartItem[]
}

model User {
  id            String     @id @default(cuid())
  email         String     @unique
  passwordHash  String
  name          String?
  role          Role       @default(USER)
  cartItems     CartItem[]
  accounts      Account[]                              // NextAuth (OAuth-ready)
  sessions      Session[]                              // NextAuth
  createdAt     DateTime   @default(now())
}

model CartItem {
  id        String   @id @default(cuid())
  userId    String
  productId Int
  qty       Int      @default(1)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  @@unique([userId, productId])   // one row per product per user
}

// Standard NextAuth models (Account, Session, VerificationToken) included per the
// @auth/prisma-adapter schema so OAuth can be added later without a rewrite.
```

`type` is a validated string (not a Postgres enum) so admins can't create an
invalid category from the form — validation happens in the server action against
the known `ProductType` union. No separate `Category` table (categories are
fixed UI metadata keyed by `type`).

## Data access layer (`lib/queries.ts`)

- A singleton `PrismaClient` (`lib/prisma.ts`) using the Next.js `globalThis`
  pattern to avoid connection exhaustion in dev hot-reload.
- Reads: `getAllProducts()`, `getProduct(id)`, `bestSellers(n = 4)` — return
  `DecoratedProduct[]` / `DecoratedProduct | null` via `decorate()`.
- `typeCounts()` becomes a DB `groupBy` (or derived from `getAllProducts()`).

## Auth (NextAuth v5, Credentials)

**Edge/node split** (required for Next 16 — middleware runs on the edge runtime
and cannot execute bcrypt or Prisma):

- **`auth.config.ts`** (edge-safe): `pages`, the `authorized` callback (used by
  middleware for route protection), and the `jwt` / `session` callbacks that put
  `id` and `role` into the token and expose them on `session.user`. `providers: []`
  here — no bcrypt/Prisma imports.
- **`auth.ts`** (node runtime): spreads `authConfig`, adds `PrismaAdapter`,
  `session: { strategy: "jwt" }`, and the **Credentials** provider whose
  `authorize()` looks up the user by email and verifies the password with
  bcryptjs. Exports `{ auth, handlers, signIn, signOut }`.
- **`app/api/auth/[...nextauth]/route.ts`**: `export const { GET, POST } = handlers`.
- **`middleware.ts`**: uses `auth` from the edge config; the `authorized`
  callback allows `/admin/*` only when `session.user.role === "ADMIN"`,
  redirecting others to `/login`. Public routes stay open.
- **Types:** module augmentation (`next-auth.d.ts`) adds `role` and `id` to
  `Session["user"]` and the JWT.

**Pages & flows:**

- `/register` — public signup form → creates a `USER` (bcrypt-hashed password),
  then signs in. Rejects duplicate email.
- `/login` — Credentials sign-in form. On success redirects to the prior page
  (or home). Admins can reach `/admin`.
- Header reflects auth state: show ผู้ใช้/login-logout controls; a link to
  `/admin` appears only for `ADMIN`.

## Admin CRUD (`/admin`, role-gated)

- `/admin` — product table with edit/delete actions.
- `/admin/new` and `/admin/[id]/edit` — a shared product form:
  fields = name, en, type (dropdown of the 5 categories), brand, res, price,
  oldPrice, rating, reviews, ai (checkbox), image (file upload).
- **Server actions** (`app/admin/actions.ts`): `createProduct`, `updateProduct`,
  `deleteProduct`. Each validates input, performs the Prisma write, and calls
  `revalidatePath()`. All actions re-check `session.user.role === "ADMIN"`
  server-side (defense in depth beyond middleware).

## Image upload → Vercel Blob

- The product form submits the image file to the create/update server action.
- The action calls `@vercel/blob` `put(filename, file, { access: "public" })`
  and stores the returned URL in `Product.imageUrl`.
- On update, replacing the image deletes the old blob (`del()`); deleting a
  product deletes its blob.
- Cards/detail render `imageUrl` via `next/image`; when null, fall back to the
  existing hatched placeholder box. `next.config` adds the Blob hostname to
  `images.remotePatterns`.

## Persistent cart

- `useCart` keeps its current component-facing API (`items`, `count`, `total`,
  `totalLabel`, `add`, `changeQty`, `remove`, `open`, `setOpen`, `toggle`) so no
  cart UI components change.
- **Guest (no session):** cart lives in `localStorage` under `sv-cart`, exactly
  as today.
- **Logged in:** cart is backed by `CartItem` rows via server actions
  (`getCart`, `addToCart`, `setCartQty`, `removeFromCart`). Reads hydrate the
  provider from the DB.
- **On login (merge):** guest `localStorage` items are merged into the user's DB
  cart (quantities summed per product), then `localStorage` is cleared and the
  provider loads the DB cart. Nothing is lost.
- The cart provider branches on session state (`useSession`) to pick the backend.

## Environment variables

New (in `.env.local`, git-ignored):

- `DATABASE_URL` — Neon pooled connection (app runtime).
- `DIRECT_URL` — Neon direct connection (Prisma migrations).
- `AUTH_SECRET` — NextAuth session/JWT secret.
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob token.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` — seeded admin account credentials.

`prisma/schema.prisma` uses `url = env("DATABASE_URL")` and
`directUrl = env("DIRECT_URL")`.

## Seeding (`prisma/seed.ts`)

- Inserts today's 8 products (from the current `PRODUCTS` data) so the storefront
  looks identical on first run.
- Creates one `ADMIN` user from `ADMIN_EMAIL` / `ADMIN_PASSWORD` (bcrypt-hashed)
  so admin is reachable immediately after seeding.
- Idempotent (`upsert`) so re-running seed is safe.

## Build / implementation order (high level)

1. Install deps; add Prisma + Neon; write `schema.prisma`; `prisma migrate dev`.
2. `lib/prisma.ts` singleton; `lib/queries.ts` reads; drop `PRODUCTS`/`DECORATED`
   and derive `typeLabel`; convert server pages to async DB reads. Seed. Verify
   storefront unchanged.
3. NextAuth: schema adapter models, `auth.config.ts` / `auth.ts` / route /
   middleware / types; `/register` + `/login`; header auth state. Seed admin.
4. Admin CRUD pages + server actions (role-gated), text fields first.
5. Vercel Blob image upload wired into the admin form + `next/image` rendering
   with placeholder fallback.
6. Persistent cart: cart server actions, provider branching, login-merge.

Each step ends with `next build` passing and the app verified running.

## Risks / decisions

- **Edge/node split** is the main correctness risk — bcrypt/Prisma must never be
  bundled into edge middleware. The split-config pattern is the mitigation.
- **`next-auth@beta`** (v5) is still beta; pinned version, isolated in the auth
  files so an upgrade is contained.
- Converting pages to async removes static generation for product detail; DB
  reads + `revalidatePath` keep the storefront fresh. Acceptable for this scale.
