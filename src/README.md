# SuuqBook — Smart Business App

A cloud point-of-sale and inventory management app for small traders and
wholesalers, built for Islii Traders in Nairobi.

## Stack

- TanStack Start (React 19)
- TypeScript
- Tailwind CSS
- Supabase (Postgres, Auth, Row-Level Security)

## Development

You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
npm install
npm run dev
```

The app reads its Supabase connection from `.env` (`VITE_SUPABASE_URL`,
`VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).

## Project structure

- `src/routes/` — pages (file-based routing)
- `src/lib/hooks/` — data hooks (TanStack Query + Supabase)
- `src/lib/auth.tsx` — auth/session/role context
- `src/lib/team.functions.ts` — server functions for employee management
- `supabase/migrations/` — database schema and Row-Level Security policies
