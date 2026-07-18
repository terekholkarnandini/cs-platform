-- ============================================================
-- SQL Migration: API Keys Table & Webhook Configuration
-- ============================================================

-- Create api_keys table
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade not null,
  name text not null,
  key_hash text not null unique,
  key_prefix text not null,
  status text not null default 'active' check (status in ('active', 'revoked')),
  created_at timestamptz default now() not null,
  last_used_at timestamptz
);

-- Enable Row Level Security
alter table public.api_keys enable row level security;

-- Create policies (safe checks in case they already exist)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'api_keys'
      and policyname = 'Users can view their company''s API keys'
  ) then
    create policy "Users can view their company''s API keys"
      on public.api_keys for select
      using (
        exists (
          select 1 from public.companies
          where companies.id = api_keys.company_id
            and companies.owner_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'api_keys'
      and policyname = 'Users can insert their company''s API keys'
  ) then
    create policy "Users can insert their company''s API keys"
      on public.api_keys for insert
      with check (
        exists (
          select 1 from public.companies
          where companies.id = api_keys.company_id
            and companies.owner_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'api_keys'
      and policyname = 'Users can update their company''s API keys'
  ) then
    create policy "Users can update their company''s API keys"
      on public.api_keys for update
      using (
        exists (
          select 1 from public.companies
          where companies.id = api_keys.company_id
            and companies.owner_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'api_keys'
      and policyname = 'Users can delete their company''s API keys'
  ) then
    create policy "Users can delete their company''s API keys"
      on public.api_keys for delete
      using (
        exists (
          select 1 from public.companies
          where companies.id = api_keys.company_id
            and companies.owner_id = auth.uid()
        )
      );
  end if;
end $$;

-- Alter companies table to add webhook_url
alter table public.companies add column if not exists webhook_url text;
