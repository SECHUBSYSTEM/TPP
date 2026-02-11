# E-Commerce RBAC

Role-based access control (RBAC) app for e-commerce: **Admin**, **Location Manager**, **Product Manager**, and **Customer**. Built with Next.js 16 (App Router), React 19, Tailwind, TypeScript, Supabase (Postgres), and Prisma 7.

## Features

- **Admin:** Full access — manage users, managers, customers, orders, locations, product lines, and products. No self-signup; admin creates accounts and assigns roles/scopes.
- **Location Manager:** Scoped by location(s). View and edit customers and orders in assigned locations only.
- **Product Manager:** Scoped by product line(s). View and edit customers and orders that touch assigned product lines.
- **Customer:** Shop, cart, place orders, and view own orders only.
- **Auth:** Username/password login; session via HTTP-only cookie. Optional display names for managers and admins.

## Prerequisites

- Node.js 18+
- pnpm (or npm/yarn/bun)
- PostgreSQL (e.g. [Supabase](https://supabase.com))

## Environment variables

Create a `.env` file in the project root:

```env
# Required: Postgres connection string (e.g. Supabase)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"

# Optional: used for JWT signing (defaults to a fallback if unset)
JWT_SECRET="your-secret-at-least-32-chars"
```

## Setup

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Generate Prisma client**

   ```bash
   pnpm prisma generate
   ```

3. **Run migrations**

   ```bash
   pnpm prisma migrate dev
   ```

4. **Seed the database** (locations, product lines, products, users, customers, sample orders)

   ```bash
   pnpm db:seed
   ```

All seeded users share the same password: **`password123`**.

## Run the app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Use **Sign in** and the credentials below.

## Login details (all roles)

After running `pnpm db:seed`, use these accounts. **Password for every user: `password123`**.

| Role              | Username       | Password     | Notes |
|-------------------|----------------|-------------|-------|
| **Admin**         | `admin1`       | `password123` | Jane Admin |
| **Admin**         | `admin2`       | `password123` | John Admin |
| **Location Manager** | `lm_nigeria` | `password123` | Ngozi Okeke — Nigeria only |
| **Location Manager** | `lm_uk_us`   | `password123` | James Wilson — UK & US |
| **Product Manager**  | `pm_electronics` | `password123` | Tunde Okafor — Electronics |
| **Product Manager**  | `pm_clothing`   | `password123` | Amara Nwosu — Clothing |
| **Product Manager**  | `pm_mixed`      | `password123` | Chioma Eze — Electronics & Clothing |
| **Customer**      | `customer1`    | `password123` | Alice Okonkwo (Nigeria) |
| **Customer**      | `customer2`    | `password123` | Bob Smith (UK) |
| **Customer**      | `customer3`    | `password123` | Chidi Nnamdi (Nigeria) |
| **Customer**      | `customer4`    | `password123` | Dave Jones (US) |

- **Admins** are redirected to `/admin/users` (then can open Users, Customers, Managers, Orders, Locations, Product lines, Products).
- **Location / Product managers** go to `/manager/orders` (Customers and Orders in scope).
- **Customers** go to `/shop` (Shop, Cart, My orders).

## Testing RBAC

- Log in as **`lm_nigeria`** → you should only see Nigeria customers and their orders.
- Log in as **`pm_electronics`** → you should only see orders that include Electronics products.
- Log in as **`customer1`** → shop, add to cart, place order; “My orders” shows only that customer’s orders.

## Scripts

| Command | Description |
|--------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm prisma generate` | Generate Prisma client |
| `pnpm prisma migrate dev` | Run migrations (dev) |
| `pnpm db:seed` | Seed database |

## Tech stack

- **Next.js 16** (App Router), **React 19**, **TypeScript**, **Tailwind CSS 4**
- **Supabase** (Postgres), **Prisma 7** (with `@prisma/adapter-pg`)
- **Auth:** bcrypt (passwords), jose (JWT), HTTP-only cookie sessions
- **API:** Next.js Route Handlers, `$axios` on the client with credentials
