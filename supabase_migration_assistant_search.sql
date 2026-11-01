-- ==============================================================================
-- MedVault Migration: Intelligent Medical Report Search & Retrieval
-- File: supabase_migration_assistant_search.sql
-- Description: Additive migration for document search metadata, medical measurements,
--              full-text search indexes, RLS policies, and private storage policies.
-- ==============================================================================

-- 1. Add processing status to existing vault_documents table without breaking existing admin approval status
ALTER TABLE public.vault_documents 
  ADD COLUMN IF NOT EXISTS processing_status text DEFAULT 'pending' 
  CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed'));

ALTER TABLE public.vault_documents 
  ADD COLUMN IF NOT EXISTS processing_error text;

-- 2. Create vault_document_metadata table for searchable extracted text & summaries
CREATE TABLE IF NOT EXISTS public.vault_document_metadata (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id uuid REFERENCES public.vault_documents(id) ON DELETE CASCADE NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  extracted_text text,
  summary text,
  category text,
  keywords text[] DEFAULT '{}'::text[],
  report_date date,
  confidence numeric DEFAULT 1.0,
  processing_status text DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  processed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on vault_document_metadata
ALTER TABLE public.vault_document_metadata ENABLE ROW LEVEL SECURITY;

-- Metadata RLS Policies (Users manage their own records; Admins can manage all)
DROP POLICY IF EXISTS "Users can view own document metadata" ON public.vault_document_metadata;
CREATE POLICY "Users can view own document metadata" ON public.vault_document_metadata
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own document metadata" ON public.vault_document_metadata;
CREATE POLICY "Users can insert own document metadata" ON public.vault_document_metadata
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own document metadata" ON public.vault_document_metadata;
CREATE POLICY "Users can update own document metadata" ON public.vault_document_metadata
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own document metadata" ON public.vault_document_metadata;
CREATE POLICY "Users can delete own document metadata" ON public.vault_document_metadata
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all metadata" ON public.vault_document_metadata;
CREATE POLICY "Admins can manage all metadata" ON public.vault_document_metadata
  FOR ALL USING (public.is_admin());

-- 3. Create vault_medical_measurements table for individual laboratory/vital readings
CREATE TABLE IF NOT EXISTS public.vault_medical_measurements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id uuid REFERENCES public.vault_documents(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  test_name text NOT NULL,
  normalized_test_name text NOT NULL,
  value_numeric numeric,
  value_text text,
  unit text,
  reference_range text,
  test_date date,
  page_number integer DEFAULT 1,
  source_excerpt text,
  confidence numeric DEFAULT 1.0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on vault_medical_measurements
ALTER TABLE public.vault_medical_measurements ENABLE ROW LEVEL SECURITY;

-- Measurements RLS Policies
DROP POLICY IF EXISTS "Users can view own medical measurements" ON public.vault_medical_measurements;
CREATE POLICY "Users can view own medical measurements" ON public.vault_medical_measurements
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own medical measurements" ON public.vault_medical_measurements;
CREATE POLICY "Users can insert own medical measurements" ON public.vault_medical_measurements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own medical measurements" ON public.vault_medical_measurements;
CREATE POLICY "Users can update own medical measurements" ON public.vault_medical_measurements
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own medical measurements" ON public.vault_medical_measurements;
CREATE POLICY "Users can delete own medical measurements" ON public.vault_medical_measurements
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all medical measurements" ON public.vault_medical_measurements;
CREATE POLICY "Admins can manage all medical measurements" ON public.vault_medical_measurements
  FOR ALL USING (public.is_admin());

-- 4. Full-Text Search (FTS) index on document metadata
ALTER TABLE public.vault_document_metadata 
  ADD COLUMN IF NOT EXISTS fts tsvector 
  GENERATED ALWAYS AS (
    to_tsvector('english', 
      coalesce(summary, '') || ' ' || 
      coalesce(category, '') || ' ' || 
      array_to_string(keywords, ' ') || ' ' || 
      coalesce(extracted_text, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_vdm_fts ON public.vault_document_metadata USING gin(fts);
CREATE INDEX IF NOT EXISTS idx_vdm_doc_id ON public.vault_document_metadata(document_id);
CREATE INDEX IF NOT EXISTS idx_vdm_user_id ON public.vault_document_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_vdm_report_date ON public.vault_document_metadata(report_date);
CREATE INDEX IF NOT EXISTS idx_vdm_category ON public.vault_document_metadata(category);

CREATE INDEX IF NOT EXISTS idx_vmm_doc_id ON public.vault_medical_measurements(document_id);
CREATE INDEX IF NOT EXISTS idx_vmm_user_id ON public.vault_medical_measurements(user_id);
CREATE INDEX IF NOT EXISTS idx_vmm_norm_name ON public.vault_medical_measurements(normalized_test_name);
CREATE INDEX IF NOT EXISTS idx_vmm_test_date ON public.vault_medical_measurements(test_date);

-- 5. Storage Security Policy Updates (Securing the vault_assets bucket)
-- When switching 'vault_assets' bucket to Private in Supabase Storage,
-- use owner-scoped policies:
--
-- drop policy if exists "Allow authenticated users to upload to vault_assets" on storage.objects;
-- drop policy if exists "Allow users to view all files for rendering" on storage.objects;
--
-- create policy "Allow users to upload own files" on storage.objects
--   for insert with check (bucket_id = 'vault_assets' and (storage.foldername(name))[1] = auth.uid()::text);
--
-- create policy "Allow users to read own files" on storage.objects
--   for select using (bucket_id = 'vault_assets' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
--
-- create policy "Allow users to delete own files" on storage.objects
--   for delete using (bucket_id = 'vault_assets' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
