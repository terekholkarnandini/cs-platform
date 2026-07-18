-- ============================================================
-- Analytics Migration: conversation_history table
-- Run this in the Supabase SQL editor (project dashboard)
-- ============================================================

-- conversation_history table
create table if not exists public.conversation_history (
  id              uuid default gen_random_uuid() primary key,
  company_id      uuid references public.companies(id) on delete cascade not null,
  created_at      timestamp with time zone default timezone('utc'::text, now()) not null,
  message         text not null,
  answer          text not null,
  response_time_ms integer default 0 not null,
  resolved_by_ai  boolean default true not null,
  confidence_score numeric(5,4) default 0 not null,
  category        text default 'Other' not null
);

-- Index for fast per-company time-range queries
create index if not exists idx_conversation_history_company_created
  on public.conversation_history(company_id, created_at desc);

-- Enable Row Level Security
alter table public.conversation_history enable row level security;

-- RLS policy: authenticated users can only see their own company's conversations
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'conversation_history'
    and policyname = 'Users can view their own company conversations'
  ) then
    create policy "Users can view their own company conversations"
      on public.conversation_history for select
      using (
        company_id in (
          select id from public.companies where owner_id = auth.uid()
        )
      );
  end if;
end $$;

-- Note: INSERT is done exclusively by the backend using the service-role key,
-- which bypasses RLS. No INSERT policy is needed for authenticated users.
