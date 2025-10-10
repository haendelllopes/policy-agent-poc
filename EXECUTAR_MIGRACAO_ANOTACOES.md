# 🚀 EXECUTAR MIGRAÇÃO: Bloco de Notas do Agente

## 📋 INSTRUÇÕES:

### 1. **Abrir Supabase SQL Editor:**
- Ir em: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new

### 2. **Copiar e colar o SQL abaixo:**

```sql
-- ===================================================================
-- MIGRAÇÃO: Bloco de Notas do Agente AI
-- ===================================================================

-- Criar tabela de anotações do agente
CREATE TABLE IF NOT EXISTS agente_anotacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Relacionamentos
  colaborador_id UUID REFERENCES users(id) ON DELETE CASCADE,
  trilha_id UUID REFERENCES trilhas(id) ON DELETE SET NULL,
  
  -- Tipo de anotação
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN (
    'sentimento_trilha',     -- Sentimento sobre uma trilha específica
    'sentimento_empresa',    -- Sentimento sobre a empresa
    'dificuldade_conteudo',  -- Dificuldade relatada em conteúdo
    'sugestao_colaborador',  -- Sugestão do colaborador
    'padrao_identificado',   -- Padrão identificado pelo agente
    'observacao_geral'       -- Observação geral
  )),
  
  -- Conteúdo da anotação
  titulo VARCHAR(255) NOT NULL,
  anotacao TEXT NOT NULL,
  
  -- Análise de sentimento da anotação
  sentimento VARCHAR(20) CHECK (sentimento IN ('muito_positivo', 'positivo', 'neutro', 'negativo', 'muito_negativo')),
  intensidade_sentimento DECIMAL(3,2), -- 0.00 a 1.00
  
  -- Metadados
  contexto JSONB, -- {conversa_id, momento_onboarding, topico, etc}
  tags TEXT[], -- Array de tags para facilitar busca
  
  -- Controle
  relevante BOOLEAN DEFAULT true, -- Se a anotação ainda é relevante
  gerou_melhoria BOOLEAN DEFAULT false, -- Se já gerou uma sugestão de melhoria
  improvement_id UUID REFERENCES onboarding_improvements(id), -- Link com melhoria gerada
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_agente_anotacoes_tenant ON agente_anotacoes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agente_anotacoes_colaborador ON agente_anotacoes(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_agente_anotacoes_trilha ON agente_anotacoes(trilha_id);
CREATE INDEX IF NOT EXISTS idx_agente_anotacoes_tipo ON agente_anotacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_agente_anotacoes_sentimento ON agente_anotacoes(sentimento);
CREATE INDEX IF NOT EXISTS idx_agente_anotacoes_relevante ON agente_anotacoes(tenant_id, relevante);
CREATE INDEX IF NOT EXISTS idx_agente_anotacoes_tags ON agente_anotacoes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_agente_anotacoes_created_at ON agente_anotacoes(created_at);

-- RLS (Row Level Security)
ALTER TABLE agente_anotacoes ENABLE ROW LEVEL SECURITY;

-- Política: Admins podem ver todas as anotações do tenant
CREATE POLICY "Admins podem ver anotações do tenant" ON agente_anotacoes
  FOR ALL USING (
    tenant_id IN (
      SELECT t.id FROM tenants t 
      JOIN users u ON u.tenant_id = t.id 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );
```

### 3. **Executar (RUN):**
- Clicar em "RUN" ou "Executar"
- Aguardar confirmação: "Success. No rows returned"

### 4. **Verificar criação:**
```sql
-- Testar se a tabela foi criada
SELECT * FROM agente_anotacoes LIMIT 1;
```

---

## ✅ **RESULTADO ESPERADO:**

Se funcionar, você verá:
- ✅ Tabela `agente_anotacoes` criada
- ✅ Índices criados
- ✅ Políticas RLS configuradas
- ✅ Sistema pronto para anotações automáticas

---

**Execute agora e me avise o resultado!** 🚀
