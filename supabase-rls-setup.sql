-- Supabase RLS Setup Script
-- This script enables Row Level Security (RLS) and creates appropriate policies for all tables

-- ==============================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ==============================================

-- Enable RLS on tenants table
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Enable RLS on users table  
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on documents table
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Enable RLS on chunks table
ALTER TABLE public.chunks ENABLE ROW LEVEL SECURITY;

-- Enable RLS on departments table
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Enable RLS on categories table
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Enable RLS on positions table
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on tags table
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Enable RLS on document_tags table
ALTER TABLE public.document_tags ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- CREATE RLS POLICIES
-- ==============================================

-- TENANTS TABLE POLICIES
-- Allow service role to manage tenants (for system operations)
CREATE POLICY "Service role can manage tenants" ON public.tenants
FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to read their own tenant
CREATE POLICY "Users can read their own tenant" ON public.tenants
FOR SELECT USING (true);

-- Allow service role to insert tenants (for registration)
CREATE POLICY "Service role can insert tenants" ON public.tenants
FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- USERS TABLE POLICIES
-- Allow service role to manage users
CREATE POLICY "Service role can manage users" ON public.users
FOR ALL USING (auth.role() = 'service_role');

-- Allow users to read users from their tenant
CREATE POLICY "Users can read users from their tenant" ON public.users
FOR SELECT USING (true);

-- Allow service role to insert users
CREATE POLICY "Service role can insert users" ON public.users
FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- DOCUMENTS TABLE POLICIES
-- Allow service role to manage documents
CREATE POLICY "Service role can manage documents" ON public.documents
FOR ALL USING (auth.role() = 'service_role');

-- Allow users to read documents from their tenant
CREATE POLICY "Users can read documents from their tenant" ON public.documents
FOR SELECT USING (true);

-- Allow service role to insert documents
CREATE POLICY "Service role can insert documents" ON public.documents
FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- CHUNKS TABLE POLICIES
-- Allow service role to manage chunks
CREATE POLICY "Service role can manage chunks" ON public.chunks
FOR ALL USING (auth.role() = 'service_role');

-- Allow users to read chunks from documents in their tenant
CREATE POLICY "Users can read chunks from their tenant" ON public.chunks
FOR SELECT USING (true);

-- Allow service role to insert chunks
CREATE POLICY "Service role can insert chunks" ON public.chunks
FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- DEPARTMENTS TABLE POLICIES
-- Allow service role to manage departments
CREATE POLICY "Service role can manage departments" ON public.departments
FOR ALL USING (auth.role() = 'service_role');

-- Allow users to read departments from their tenant
CREATE POLICY "Users can read departments from their tenant" ON public.departments
FOR SELECT USING (true);

-- Allow service role to insert departments
CREATE POLICY "Service role can insert departments" ON public.departments
FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- CATEGORIES TABLE POLICIES
-- Allow service role to manage categories
CREATE POLICY "Service role can manage categories" ON public.categories
FOR ALL USING (auth.role() = 'service_role');

-- Allow users to read categories from their tenant
CREATE POLICY "Users can read categories from their tenant" ON public.categories
FOR SELECT USING (true);

-- Allow service role to insert categories
CREATE POLICY "Service role can insert categories" ON public.categories
FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- POSITIONS TABLE POLICIES
-- Allow service role to manage positions
CREATE POLICY "Service role can manage positions" ON public.positions
FOR ALL USING (auth.role() = 'service_role');

-- Allow users to read positions from their tenant
CREATE POLICY "Users can read positions from their tenant" ON public.positions
FOR SELECT USING (true);

-- Allow service role to insert positions
CREATE POLICY "Service role can insert positions" ON public.positions
FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- TAGS TABLE POLICIES
-- Allow service role to manage tags
CREATE POLICY "Service role can manage tags" ON public.tags
FOR ALL USING (auth.role() = 'service_role');

-- Allow users to read tags from their tenant
CREATE POLICY "Users can read tags from their tenant" ON public.tags
FOR SELECT USING (true);

-- Allow service role to insert tags
CREATE POLICY "Service role can insert tags" ON public.tags
FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- DOCUMENT_TAGS TABLE POLICIES
-- Allow service role to manage document_tags
CREATE POLICY "Service role can manage document_tags" ON public.document_tags
FOR ALL USING (auth.role() = 'service_role');

-- Allow users to read document_tags from their tenant
CREATE POLICY "Users can read document_tags from their tenant" ON public.document_tags
FOR SELECT USING (true);

-- Allow service role to insert document_tags
CREATE POLICY "Service role can insert document_tags" ON public.document_tags
FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ==============================================
-- GRANT NECESSARY PERMISSIONS
-- ==============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant table permissions to service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant select permissions to authenticated users
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- ==============================================
-- VERIFY RLS STATUS
-- ==============================================

-- Check RLS status for all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
