-- 1. Create the profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  credits integer default 100,
  plan text default 'Free',
  paypal_subscription_id text,
  subscription_status text default 'active',
  subscription_start_date timestamp with time zone,
  subscription_end_date timestamp with time zone,
  total_credits_used integer default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- 3. Create policies
-- Allow users to view their own profile
create policy "Users can view own profile" 
  on public.profiles for select 
  using (auth.uid() = id);

-- Allow users to update their own profile
create policy "Users can update own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

-- Allow users to insert their own profile (fallback if trigger fails)
create policy "Users can insert own profile" 
  on public.profiles for insert 
  with check (auth.uid() = id);

-- 4. Create a trigger to automatically create a profile for new users
-- This ensures every new signup gets a profile with 100 credits immediately
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, credits, plan, total_credits_used)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    100,
    'Free',
    0
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop the trigger if it exists to avoid duplication errors on re-runs
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. (Optional) Backfill existing users who might be missing a profile
-- Uncomment and run this block if you have existing users without profiles
/*
insert into public.profiles (id, email, credits, plan, total_credits_used)
select id, email, 100, 'Free', 0
from auth.users
where id not in (select id from public.profiles);
*/
