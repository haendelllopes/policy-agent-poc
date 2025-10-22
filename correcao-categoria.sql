-- ============================================
-- CORREÇÃO: Constraint de categoria onboarding_improvements
-- ============================================

-- Primeiro, vamos ver quais valores são permitidos na constraint atual
-- (Execute este comando para ver os valores permitidos)
SELECT conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'onboarding_improvements_categoria_check';

-- Remover a constraint existente
ALTER TABLE onboarding_improvements DROP CONSTRAINT IF EXISTS onboarding_improvements_categoria_check;

-- Recriar a constraint com valores válidos (baseado nos valores comuns)
ALTER TABLE onboarding_improvements 
ADD CONSTRAINT onboarding_improvements_categoria_check 
CHECK (categoria IN ('processo', 'comunicacao', 'conteudo', 'ferramenta', 'treinamento', 'feedback', 'outros'));

-- Agora inserir os dados com categorias válidas
INSERT INTO onboarding_improvements (
    tenant_id, categoria, titulo, descricao, status, tipo_acao,
    alvo_colaborador_id, justificativa_ia, dados_acao, created_at
) VALUES 
('5978f911-738b-4aae-802a-f037fdac2e64', 'processo', 'Revisar trilha de onboarding', 'Ajustar conteúdo da trilha de desenvolvimento', 'pendente_aprovacao', 'ajustar_trilha', '4ab6c765-bcfc-4280-84cd-3190fcf881c2', 'IA detectou padrão de dificuldade com documentação técnica', '{"trilha_id": "dev-onboarding", "ajustes": ["adicionar_exemplos_praticos", "simplificar_linguagem"]}', NOW()),
('5978f911-738b-4aae-802a-f037fdac2e64', 'comunicacao', 'Agendar reunião de feedback', 'Reunião individual com colaborador em risco', 'aprovada_pendente_execucao', 'contatar_colaborador', '4ab6c765-bcfc-4280-84cd-3190fcf881c2', 'Score de risco alto requer intervenção imediata', '{"tipo_reuniao": "feedback", "urgencia": "alta", "agendamento": "proximo_dia_util"}', NOW())
ON CONFLICT DO NOTHING;
