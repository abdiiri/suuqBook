-- Adds employee commission support.
-- Safe to run on the existing database: every statement is additive
-- (add column if not exists) and won't touch existing data.

-- The commission rate is a property of the business (stored on the owner's
-- own profile row) — a percentage of each sale an employee earns.
alter table public.profiles
  add column if not exists commission_rate numeric not null default 0
  check (commission_rate >= 0 and commission_rate <= 100);

-- Snapshot the commission earned on each sale at the time it was made, so a
-- later change to the rate never rewrites historical numbers.
alter table public.sales
  add column if not exists commission_amount numeric not null default 0;
