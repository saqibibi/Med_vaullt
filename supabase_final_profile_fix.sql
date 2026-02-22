/* Save this file as supabase_final_profile_fix.sql and run it in the Supabase SQL Editor */

-- 1. Ensure the JSONB column exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contacts JSONB DEFAULT '[]'::jsonb;

-- 2. Drop the policies if they exist so we can recreate them cleanly
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- 3. Create the UPDATE & INSERT policies to allow users to modify or create their own rows!
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Just in case, grant USAGE, INSERT, and UPDATE to authenticated users:
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
