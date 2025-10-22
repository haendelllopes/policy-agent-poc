-- ===================================================================
-- MIGRAÇÃO: Ordem Única e Crescente para Trilhas
-- Data: 2025-10-21
-- Descrição: Implementa sistema de ordenação única e crescente para trilhas
-- ===================================================================

-- 1. Criar índice único parcial (ordem > 0 deve ser única por tenant)
CREATE UNIQUE INDEX IF NOT EXISTS unique_ordem_por_tenant 
ON trilhas (tenant_id, ordem) 
WHERE ordem > 0;

-- 2. Criar função para obter próxima ordem disponível
CREATE OR REPLACE FUNCTION obter_proxima_ordem_trilha(p_tenant_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_proxima_ordem INTEGER;
BEGIN
  SELECT COALESCE(MAX(ordem), 0) + 1
  INTO v_proxima_ordem
  FROM trilhas
  WHERE tenant_id = p_tenant_id AND ordem > 0;
  
  RETURN v_proxima_ordem;
END;
$$ LANGUAGE plpgsql;

-- 3. Comentários
COMMENT ON INDEX unique_ordem_por_tenant IS 
'Garante que não há duas trilhas com a mesma ordem no mesmo tenant. Ordem 0 é permitida múltiplas vezes (sem ordem definida).';

COMMENT ON FUNCTION obter_proxima_ordem_trilha IS 
'Retorna a próxima ordem disponível para uma trilha no tenant';

-- 4. Atualizar trilhas existentes com ordem baseada na data de criação (se ordem = 0)
WITH trilhas_ordenadas AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as nova_ordem
  FROM trilhas 
  WHERE ordem = 0 OR ordem IS NULL
)
UPDATE trilhas 
SET ordem = to_ordenadas.nova_ordem
FROM trilhas_ordenadas to_ordenadas
WHERE trilhas.id = to_ordenadas.id;

-- Fim da migração
