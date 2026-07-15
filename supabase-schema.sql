-- Companies Table Schema
create table if not exists public.companies (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  owner_id uuid references auth.users(id) on delete cascade not null unique,
  name text not null,
  industry text not null,
  company_size text not null,
  logo_url text,
  integration_type text not null check (integration_type in ('API', 'Widget', 'Both')),
  onboarding_completed boolean default false not null,
  website text,
  support_email text,
  
  -- Dashboard Statistics Data
  total_conversations integer default 12847 not null,
  resolved_by_ai numeric(5,2) default 94.20 not null,
  open_tickets integer default 128 not null,
  avg_response_time numeric(3,1) default 1.4 not null,
  csat_score numeric(2,1) default 4.8 not null
);

-- Enable Row Level Security
alter table public.companies enable row level security;

-- Create policies (safe checks in case they already exist)
do $$ 
begin
  if not exists (
    select 1 from pg_policies where tablename = 'companies' and policyname = 'Users can view their own company'
  ) then
    create policy "Users can view their own company" 
      on public.companies for select 
      using (auth.uid() = owner_id);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'companies' and policyname = 'Users can insert their own company'
  ) then
    create policy "Users can insert their own company" 
      on public.companies for insert 
      with check (auth.uid() = owner_id);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'companies' and policyname = 'Users can update their own company'
  ) then
    create policy "Users can update their own company" 
      on public.companies for update 
      using (auth.uid() = owner_id);
  end if;
end $$;

-- Storage Bucket configuration for logos
insert into storage.buckets (id, name, public) 
values ('logos', 'logos', true)
on conflict (id) do nothing;

-- Create storage access policies
do $$ 
begin
  -- Note: These policies assume the 'storage.objects' table exists and RLS is active on it
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Public Access'
  ) then
    create policy "Public Access" on storage.objects for select using (bucket_id = 'logos');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Authenticated users can upload logos'
  ) then
    create policy "Authenticated users can upload logos" on storage.objects for insert with check (bucket_id = 'logos' and auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Owners can update/delete their logos'
  ) then
    create policy "Owners can update/delete their logos" on storage.objects for update using (bucket_id = 'logos' and auth.role() = 'authenticated');
  end if;
end $$;
