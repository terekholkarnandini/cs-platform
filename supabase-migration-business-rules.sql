-- Create business_rules table
create table if not exists public.business_rules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade unique not null,
  refund_enabled boolean default false not null,
  refund_amount_limit numeric default 50 not null,
  refund_days integer default 30 not null,
  replacement_enabled boolean default false not null,
  replacement_condition text default 'damaged items',
  warranty_enabled boolean default false not null,
  warranty_months integer default 24 not null,
  escalation_enabled boolean default false not null,
  escalation_order_amount numeric default 500 not null,
  timezone text default 'America/New_York' not null,
  working_start time default '09:00:00' not null,
  working_end time default '18:00:00' not null,
  working_days text[] default array['Mon', 'Tue', 'Wed', 'Thu', 'Fri']::text[] not null,
  custom_prompt text default 'You are Acme''s customer support assistant. Be warm, concise, and empathetic.
Never promise anything outside the policies above.
Always confirm order numbers before making changes.
When unsure, escalate to a human agent.' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table public.business_rules enable row level security;

-- Create policies (safe checks in case they already exist)
do $$ 
begin
  if not exists (
    select 1 from pg_policies where tablename = 'business_rules' and policyname = 'Users can view their own company business rules'
  ) then
    create policy "Users can view their own company business rules" 
      on public.business_rules for select 
      using (
        exists (
          select 1 from public.companies 
          where companies.id = business_rules.company_id 
          and companies.owner_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'business_rules' and policyname = 'Users can insert their own company business rules'
  ) then
    create policy "Users can insert their own company business rules" 
      on public.business_rules for insert 
      with check (
        exists (
          select 1 from public.companies 
          where companies.id = business_rules.company_id 
          and companies.owner_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'business_rules' and policyname = 'Users can update their own company business rules'
  ) then
    create policy "Users can update their own company business rules" 
      on public.business_rules for update 
      using (
        exists (
          select 1 from public.companies 
          where companies.id = business_rules.company_id 
          and companies.owner_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'business_rules' and policyname = 'Users can delete their own company business rules'
  ) then
    create policy "Users can delete their own company business rules" 
      on public.business_rules for delete 
      using (
        exists (
          select 1 from public.companies 
          where companies.id = business_rules.company_id 
          and companies.owner_id = auth.uid()
        )
      );
  end if;
end $$;
