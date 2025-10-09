-- ===================================================================
-- MIGRAÇÃO: Sistema de Trilhas de Onboarding
-- Data: 2025-10-08
-- ===================================================================

-- 1. Adicionar colunas de onboarding à tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS position_id UUID REFERENCES positions(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_status VARCHAR(50) DEFAULT 'nao_iniciado';
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_inicio DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_fim DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pontuacao_total INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Criar tabela trilhas
CREATE TABLE IF NOT EXISTS trilhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  prazo_dias INTEGER NOT NULL DEFAULT 7,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela trilha_conteudos
CREATE TABLE IF NOT EXISTS trilha_conteudos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trilha_id UUID NOT NULL REFERENCES trilhas(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('documento', 'video', 'link', 'pdf')),
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  url TEXT NOT NULL,
  ordem INTEGER DEFAULT 0,
  obrigatorio BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar tabela colaborador_trilhas (progresso)
CREATE TABLE IF NOT EXISTS colaborador_trilhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trilha_id UUID NOT NULL REFERENCES trilhas(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'nao_iniciada' CHECK (status IN ('nao_iniciada', 'em_andamento', 'aguardando_quiz', 'concluida', 'atrasada')),
  data_inicio TIMESTAMP WITH TIME ZONE,
  data_limite TIMESTAMP WITH TIME ZONE,
  data_conclusao TIMESTAMP WITH TIME ZONE,
  pontuacao_final INTEGER DEFAULT 0,
  certificado_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(colaborador_id, trilha_id)
);

-- 5. Criar tabela conteudo_aceites
CREATE TABLE IF NOT EXISTS conteudo_aceites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_trilha_id UUID NOT NULL REFERENCES colaborador_trilhas(id) ON DELETE CASCADE,
  conteudo_id UUID NOT NULL REFERENCES trilha_conteudos(id) ON DELETE CASCADE,
  aceito_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(colaborador_trilha_id, conteudo_id)
);

-- 6. Criar tabela quiz_tentativas
CREATE TABLE IF NOT EXISTS quiz_tentativas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_trilha_id UUID NOT NULL REFERENCES colaborador_trilhas(id) ON DELETE CASCADE,
  questoes JSONB NOT NULL,
  respostas JSONB,
  nota INTEGER DEFAULT 0,
  aprovado BOOLEAN DEFAULT false,
  tentativa_numero INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Criar tabela gamificacao_pontos
CREATE TABLE IF NOT EXISTS gamificacao_pontos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('trilha_concluida', 'quiz_aprovado', 'bonus_antecipacao', 'bonus_perfeito')),
  pontos INTEGER NOT NULL DEFAULT 0,
  trilha_id UUID REFERENCES trilhas(id) ON DELETE SET NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para sistema de trilhas
CREATE INDEX IF NOT EXISTS idx_trilhas_tenant ON trilhas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trilhas_tenant_ativo ON trilhas(tenant_id, ativo);
CREATE INDEX IF NOT EXISTS idx_trilha_conteudos_trilha ON trilha_conteudos(trilha_id);
CREATE INDEX IF NOT EXISTS idx_colaborador_trilhas_colaborador ON colaborador_trilhas(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_colaborador_trilhas_status ON colaborador_trilhas(colaborador_id, status);
CREATE INDEX IF NOT EXISTS idx_conteudo_aceites_colaborador_trilha ON conteudo_aceites(colaborador_trilha_id);
CREATE INDEX IF NOT EXISTS idx_quiz_tentativas_colaborador_trilha ON quiz_tentativas(colaborador_trilha_id);
CREATE INDEX IF NOT EXISTS idx_gamificacao_colaborador ON gamificacao_pontos(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_users_position ON users(position_id);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_onboarding_status ON users(tenant_id, onboarding_status);

-- Fim da migração



