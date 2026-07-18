-- ============================================================
-- AI Configuration table
-- ============================================================

create table if not exists public.ai_configuration (
  id                   uuid        primary key default gen_random_uuid(),
  company_id           uuid        references public.companies(id) on delete cascade unique not null,
  model                text        default 'gpt-5' not null,
  response_style       text        default 'Professional' not null,
  response_length      text        default 'Medium' not null,
  temperature          numeric     default 0.2 not null,
  max_tokens           integer     default 1500 not null,
  language             text        default 'English' not null,
  fallback_response    text,
  confidence_threshold numeric     default 0.75 not null,
  enable_streaming     boolean     default true not null,
  created_at           timestamptz default now() not null,
  updated_at           timestamptz default now() not null
);

-- Enable Row Level Security
alter table public.ai_configuration enable row level security;

-- Create policies (safe checks in case they already exist)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'ai_configuration'
      and policyname = 'Users can view their own company ai configuration'
  ) then
    create policy "Users can view their own company ai configuration"
      on public.ai_configuration for select
      using (
        exists (
          select 1 from public.companies
          where companies.id = ai_configuration.company_id
            and companies.owner_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'ai_configuration'
      and policyname = 'Users can insert their own company ai configuration'
  ) then
    create policy "Users can insert their own company ai configuration"
      on public.ai_configuration for insert
      with check (
        exists (
          select 1 from public.companies
          where companies.id = ai_configuration.company_id
            and companies.owner_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'ai_configuration'
      and policyname = 'Users can update their own company ai configuration'
  ) then
    create policy "Users can update their own company ai configuration"
      on public.ai_configuration for update
      using (
        exists (
          select 1 from public.companies
          where companies.id = ai_configuration.company_id
            and companies.owner_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'ai_configuration'
      and policyname = 'Users can delete their own company ai configuration'
  ) then
    create policy "Users can delete their own company ai configuration"
      on public.ai_configuration for delete
      using (
        exists (
          select 1 from public.companies
          where companies.id = ai_configuration.company_id
            and companies.owner_id = auth.uid()
        )
      );
  end if;
end $$;
