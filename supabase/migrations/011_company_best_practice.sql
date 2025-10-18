-- Migration: Company best practice library

create table if not exists public.company_best_practices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  content text,
  external_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_company_best_practices_created_at
  on public.company_best_practices (created_at desc);

comment on table public.company_best_practices is
  'Company specific best practice notes shared with managers and owners.';
