/* Save this file as supabase_update_documents.sql and run it in the Supabase SQL Editor */

-- Add title and summary columns to the vault_documents table
ALTER TABLE public.vault_documents ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.vault_documents ADD COLUMN IF NOT EXISTS summary text;

-- (Optional) If we want to ensure any existing rows don't cause issues, we can backfill 'title' with the file_name
UPDATE public.vault_documents SET title = file_name WHERE title IS NULL;
