/* Save this file as supabase_update_profiles.sql in your root directory if needed, or run directly */

-- Update the profiles table to add the required fields for the user profile page.
-- We use ADD COLUMN safely.

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS blood_group text,
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS emergency_contact_name text,
  ADD COLUMN IF NOT EXISTS emergency_contact_relation text,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text,
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- Add a helper trigger or just let the app handle updating these rows dynamically.
-- The existing handle_new_user() function will still insert just user_id and role.
-- The RLS policies already created (Users can read own profile) are sufficient.
-- We need to add an update policy so users can modify their profile data.

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
