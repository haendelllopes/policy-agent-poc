-- ===================================================================
-- CONFIGURAÇÃO: Supabase Storage para Upload de Arquivos
-- Data: 2025-10-22
-- Descrição: Configuração do storage para upload de arquivos de trilhas
-- ===================================================================

-- 1. Criar bucket para arquivos de trilhas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'trilha-arquivos',
  'trilha-arquivos',
  true,
  104857600, -- 100MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'video/mp4',
    'video/avi',
    'video/quicktime',
    'video/x-msvideo',
    'text/plain',
    'application/rtf',
    'image/jpeg',
    'image/png',
    'image/gif'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 2. Política RLS para upload (apenas usuários autenticados)
CREATE POLICY "Usuários podem fazer upload de arquivos de trilhas"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'trilha-arquivos' AND
  auth.uid() IS NOT NULL
);

-- 3. Política RLS para visualização (público)
CREATE POLICY "Arquivos de trilhas são públicos para leitura"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'trilha-arquivos');

-- 4. Política RLS para atualização (apenas proprietário)
CREATE POLICY "Usuários podem atualizar seus próprios arquivos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'trilha-arquivos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Política RLS para exclusão (apenas proprietário)
CREATE POLICY "Usuários podem deletar seus próprios arquivos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'trilha-arquivos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 6. Função para gerar URL pública do arquivo
CREATE OR REPLACE FUNCTION obter_url_arquivo_trilha(p_bucket_id TEXT, p_file_path TEXT)
RETURNS TEXT AS $$
DECLARE
  base_url TEXT;
BEGIN
  -- URL base do Supabase Storage
  base_url := 'https://gxqwfltteimexngybwna.supabase.co/storage/v1/object/public/';
  
  RETURN base_url || p_bucket_id || '/' || p_file_path;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION obter_url_arquivo_trilha IS 
'Gera URL pública para arquivos do Supabase Storage';

-- 7. Função para validar tipo de arquivo
CREATE OR REPLACE FUNCTION validar_tipo_arquivo_trilha(p_mime_type TEXT, p_tipo_conteudo TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  CASE p_tipo_conteudo
    WHEN 'documento', 'pdf' THEN
      RETURN p_mime_type IN (
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/rtf'
      );
    WHEN 'video' THEN
      RETURN p_mime_type IN (
        'video/mp4',
        'video/avi',
        'video/quicktime',
        'video/x-msvideo'
      );
    WHEN 'link' THEN
      RETURN TRUE; -- Links não têm arquivo
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validar_tipo_arquivo_trilha IS 
'Valida se o tipo MIME é compatível com o tipo de conteúdo da trilha';

-- 8. Função para obter estatísticas de arquivos
CREATE OR REPLACE FUNCTION obter_estatisticas_arquivos_trilha(p_tenant_id UUID)
RETURNS TABLE (
  total_arquivos BIGINT,
  tamanho_total BIGINT,
  tipos_arquivos JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_arquivos,
    COALESCE(SUM(metadata->>'size')::BIGINT, 0) as tamanho_total,
    jsonb_object_agg(
      metadata->>'mimetype',
      COUNT(*)
    ) as tipos_arquivos
  FROM storage.objects
  WHERE bucket_id = 'trilha-arquivos'
    AND name LIKE 'tenant_' || p_tenant_id || '/%';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION obter_estatisticas_arquivos_trilha IS 
'Retorna estatísticas de arquivos de trilhas para um tenant';

-- Fim da configuração
