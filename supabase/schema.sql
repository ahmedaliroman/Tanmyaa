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
  referral_code text unique default gen_random_uuid()::text,
  invited_by uuid references auth.users(id),
  branding_logo text,
  branding_colors text,
  branding_presentation_template text,
  branding_presentation_template_url text,
  branding_report_template text,
  branding_report_template_url text,
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
declare
  inviter_id uuid;
  referral_code_input text;
begin
  -- Check if there's a referral code in the metadata
  referral_code_input := new.raw_user_meta_data->>'referral_code';
  
  if referral_code_input is not null then
    select id into inviter_id from public.profiles where referral_code = referral_code_input;
  end if;

  insert into public.profiles (id, email, full_name, credits, plan, total_credits_used, invited_by)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    100,
    'Free',
    0,
    inviter_id
  );

  -- If invited by someone, check if they reached 20 invitations
  if inviter_id is not null then
    -- Count successful invitations for this inviter
    if (select count(*) from public.profiles where invited_by = inviter_id) >= 20 then
      update public.profiles
      set plan = 'Pro',
          credits = credits + 600 -- Bonus credits for reaching Pro
      where id = inviter_id
      and plan = 'Free'; -- Only upgrade if they are on Free plan
    end if;
  end if;

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

-- 6. Create the usage_history table
create table if not exists public.usage_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  description text not null,
  credits_used integer not null,
  file_url text,
  type text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 7. Enable RLS for usage_history
alter table public.usage_history enable row level security;

-- 8. Create policies for usage_history
-- Allow users to view their own history
create policy "Users can view own history" 
  on public.usage_history for select 
  using (auth.uid() = user_id);

-- Allow the service role to insert history (server-side)
-- Note: In Supabase, the service role bypasses RLS, but we can still define policies for clarity
create policy "Service role can insert history" 
  on public.usage_history for insert 
  with check (true);

-- 9. Create Storage Bucket for Branding
insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do nothing;

-- Allow public read access to branding bucket
create policy "Public Access to Branding"
  on storage.objects for select
  using ( bucket_id = 'branding' );

-- Allow authenticated users to upload files to branding bucket
create policy "Authenticated users can upload branding files"
  on storage.objects for insert
  with check ( bucket_id = 'branding' and auth.role() = 'authenticated' );

-- Allow users to update their own branding files
create policy "Users can update own branding files"
  on storage.objects for update
  using ( bucket_id = 'branding' and auth.uid() = owner );

-- Allow users to delete their own branding files
create policy "Users can delete own branding files"
  on storage.objects for delete
  using ( bucket_id = 'branding' and auth.uid() = owner );
