-- Supabase Initialization Script for Med Vault

-- --- TEARDOWN EXISTING STRUCTURES ---
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user cascade;
drop function if exists public.is_admin cascade;

drop table if exists public.vault_documents cascade;
drop table if exists public.profiles cascade;

drop policy if exists "Allow authenticated users to upload to vault_assets" on storage.objects;
drop policy if exists "Allow users to view all files for rendering" on storage.objects;

-- --- 1. Create profiles table ---
create table public.profiles (
  user_id uuid references auth.users on delete cascade not null primary key,
  role text default 'user' check (role in ('user', 'admin'))
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Create policy for users to read their own profile
create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = user_id);

-- Create a security definer function to check admin status bypassing RLS
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles 
    where user_id = auth.uid() and role = 'admin'
  );
$$ language sql security definer set search_path = public;

-- Create a policy for admins to read all profiles
create policy "Admins can read all profiles" on public.profiles
  for select using ( public.is_admin() );

-- Trigger to create a profile automatically when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, role)
  values (new.id, 'user');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- --- 2. Create assets/documents table ---
create table public.vault_documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  storage_path text not null,
  public_url text not null,
  file_name text not null,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on vault_documents
alter table public.vault_documents enable row level security;

-- Users can view their own documents
create policy "Users can view own documents" on public.vault_documents
  for select using (auth.uid() = user_id);

-- Users can insert their own documents
create policy "Users can insert own documents" on public.vault_documents
  for insert with check (auth.uid() = user_id);

-- Users can delete their own documents
create policy "Users can delete own documents" on public.vault_documents
  for delete using (auth.uid() = user_id);

-- Admins can do everything
create policy "Admins can manage all documents" on public.vault_documents
  for all using ( public.is_admin() );

-- --- 3. Storage Bucket Policies ---
-- You must manually create the bucket "vault_assets" in the Supabase Dashboard UI > Storage > New Bucket
-- Ensure the bucket is set to PUBLIC.

-- Below are RLS policies for a PUBLIC bucket named 'vault_assets'
create policy "Allow authenticated users to upload to vault_assets"
  on storage.objects for insert
  with check (bucket_id = 'vault_assets' and auth.role() = 'authenticated');

create policy "Allow users to view all files for rendering"
  on storage.objects for select
  using (bucket_id = 'vault_assets');
