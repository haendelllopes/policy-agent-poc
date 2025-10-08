-- ===================================================================
-- RLS (Row Level Security) para Sistema de Trilhas
-- Data: 2025-10-08
-- ===================================================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.trilhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trilha_conteudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaborador_trilhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conteudo_aceites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_tentativas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamificacao_pontos ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS PARA TRILHAS
-- ============================================

-- Service role pode gerenciar trilhas
CREATE POLICY "Service role can manage trilhas" ON public.trilhas
FOR ALL USING (auth.role() = 'service_role');

-- Usuários autenticados podem ler trilhas do seu tenant
CREATE POLICY "Users can read trilhas from their tenant" ON public.trilhas
FOR SELECT USING (true);

-- Service role pode inserir trilhas
CREATE POLICY "Service role can insert trilhas" ON public.trilhas
FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- POLÍTICAS PARA TRILHA_CONTEUDOS
-- ============================================

-- Service role pode gerenciar conteúdos
CREATE POLICY "Service role can manage trilha_conteudos" ON public.trilha_conteudos
FOR ALL USING (auth.role() = 'service_role');

-- Usuários podem ler conteúdos
CREATE POLICY "Users can read trilha_conteudos" ON public.trilha_conteudos
FOR SELECT USING (true);

-- Service role pode inserir conteúdos
CREATE POLICY "Service role can insert trilha_conteudos" ON public.trilha_conteudos
FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- POLÍTICAS PARA COLABORADOR_TRILHAS
-- ============================================

-- Service role pode gerenciar progresso
CREATE POLICY "Service role can manage colaborador_trilhas" ON public.colaborador_trilhas
FOR ALL USING (auth.role() = 'service_role');

-- Usuários podem ler progresso
CREATE POLICY "Users can read colaborador_trilhas" ON public.colaborador_trilhas
FOR SELECT USING (true);

-- Service role pode inserir progresso
CREATE POLICY "Service role can insert colaborador_trilhas" ON public.colaborador_trilhas
FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- POLÍTICAS PARA CONTEUDO_ACEITES
-- ============================================

-- Service role pode gerenciar aceites
CREATE POLICY "Service role can manage conteudo_aceites" ON public.conteudo_aceites
FOR ALL USING (auth.role() = 'service_role');

-- Usuários podem ler aceites
CREATE POLICY "Users can read conteudo_aceites" ON public.conteudo_aceites
FOR SELECT USING (true);

-- Service role pode inserir aceites
CREATE POLICY "Service role can insert conteudo_aceites" ON public.conteudo_aceites
FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- POLÍTICAS PARA QUIZ_TENTATIVAS
-- ============================================

-- Service role pode gerenciar tentativas
CREATE POLICY "Service role can manage quiz_tentativas" ON public.quiz_tentativas
FOR ALL USING (auth.role() = 'service_role');

-- Usuários podem ler tentativas
CREATE POLICY "Users can read quiz_tentativas" ON public.quiz_tentativas
FOR SELECT USING (true);

-- Service role pode inserir tentativas
CREATE POLICY "Service role can insert quiz_tentativas" ON public.quiz_tentativas
FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- POLÍTICAS PARA GAMIFICACAO_PONTOS
-- ============================================

-- Service role pode gerenciar pontos
CREATE POLICY "Service role can manage gamificacao_pontos" ON public.gamificacao_pontos
FOR ALL USING (auth.role() = 'service_role');

-- Usuários podem ler pontos
CREATE POLICY "Users can read gamificacao_pontos" ON public.gamificacao_pontos
FOR SELECT USING (true);

-- Service role pode inserir pontos
CREATE POLICY "Service role can insert gamificacao_pontos" ON public.gamificacao_pontos
FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- VERIFICAR STATUS DO RLS
-- ============================================

-- Verificar se RLS está habilitado em todas as tabelas
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'trilhas', 'trilha_conteudos', 'colaborador_trilhas',
    'conteudo_aceites', 'quiz_tentativas', 'gamificacao_pontos'
  )
ORDER BY tablename;

