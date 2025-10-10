# 🚀 Proposta de Melhorias - Arquitetura de Dados

**Data:** 10 de outubro de 2025  
**Projeto:** Flowly - Sistema de Onboarding com IA  
**Objetivo:** Diferenciar o produto no mercado através de personalização e inteligência

---

## 📋 Índice

1. [Contexto](#contexto)
2. [Melhorias Propostas](#melhorias-propostas)
3. [Arquitetura de Dados](#arquitetura-de-dados)
4. [Plano de Implementação](#plano-de-implementação)
5. [Impacto Esperado](#impacto-esperado)

---

## 🎯 Contexto

O Flowly atualmente oferece funcionalidades "mais do mesmo" comparado aos concorrentes. Para se diferenciar, precisamos implementar três pilares:

1. **Inteligência do Agente** - Sistema de memória e aprendizado
2. **Personalização Emocional** - Adaptação ao sentimento do colaborador
3. **Segmentação Inteligente** - Trilhas por cargo e departamento

---

## 💡 Melhorias Propostas

### 1. Bloco de Notas do Agente AI (Sistema de Memória)

**Objetivo:** O agente deve aprender com as interações e sugerir melhorias ao longo do tempo.

**Funcionalidades:**
- Anotar sentimentos sobre trilhas durante conversas
- Registrar feedback sobre a empresa
- Identificar padrões de dificuldade
- Sugerir melhorias automáticas para gestores

**Valor:** Inteligência de negócio baseada em feedback real dos colaboradores

---

### 2. Análise de Sentimento do Colaborador

**Objetivo:** Adaptar o comportamento do agente conforme o estado emocional do colaborador.

**Funcionalidades:**
- Mensurar sentimento desde o primeiro contato
- Rastrear evolução emocional durante o onboarding
- Adaptar tom de comunicação (formal, casual, motivador)
- Detectar frustração e oferecer suporte proativo

**Valor:** Experiência humanizada e empática

---

### 3. Trilhas por Departamento & Cargo

**Objetivo:** Onboarding personalizado conforme cargo e departamento do colaborador.

**Funcionalidades:**
- Configurar trilhas específicas por cargo/departamento
- Trilhas "para todos", "para alguns" ou "específicas"
- Agente orienta automaticamente qual trilha realizar
- Exemplo: Coordenador de Dev ≠ Desenvolvedor de Dev

**Valor:** Onboarding mais relevante e eficiente

---

## 🗄️ Arquitetura de Dados

### Estrutura Atual (Revisão)

#### Tabela `users`
```sql
id UUID PRIMARY KEY
tenant_id UUID
name VARCHAR(255)
email VARCHAR(255)
phone VARCHAR(50)
position_id UUID REFERENCES positions(id)  -- ✅ Já existe
department_id UUID REFERENCES departments(id)  -- ✅ Já existe
role VARCHAR(50) DEFAULT 'colaborador'  -- ✅ Já existe
onboarding_status VARCHAR(50)
onboarding_inicio DATE
onboarding_fim DATE
pontuacao_total INTEGER
created_at TIMESTAMP
updated_at TIMESTAMP
```

#### Tabela `trilhas`
```sql
id UUID PRIMARY KEY
tenant_id UUID
nome VARCHAR(255)
descricao TEXT
prazo_dias INTEGER
ordem INTEGER
ativo BOOLEAN
created_at TIMESTAMP
updated_at TIMESTAMP
```

#### Tabela `onboarding_improvements` ✅
```sql
-- Já existe! Criada na migração 003
-- Usada pelo agente para registrar melhorias
id UUID PRIMARY KEY
tenant_id UUID
categoria VARCHAR(50)
prioridade VARCHAR(20)
titulo VARCHAR(255)
descricao TEXT
contexto JSONB
dados_analise JSONB
status VARCHAR(30)
-- ... outros campos
```

---

## 🆕 Novas Tabelas e Modificações

### 1. **Bloco de Notas do Agente** - Tabela `agente_anotacoes`

```sql
CREATE TABLE agente_anotacoes (
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

-- Índices
CREATE INDEX idx_agente_anotacoes_tenant ON agente_anotacoes(tenant_id);
CREATE INDEX idx_agente_anotacoes_colaborador ON agente_anotacoes(colaborador_id);
CREATE INDEX idx_agente_anotacoes_trilha ON agente_anotacoes(trilha_id);
CREATE INDEX idx_agente_anotacoes_tipo ON agente_anotacoes(tipo);
CREATE INDEX idx_agente_anotacoes_sentimento ON agente_anotacoes(sentimento);
CREATE INDEX idx_agente_anotacoes_relevante ON agente_anotacoes(tenant_id, relevante);
CREATE INDEX idx_agente_anotacoes_tags ON agente_anotacoes USING GIN(tags);
```

**Exemplo de uso:**
```json
{
  "tipo": "sentimento_trilha",
  "titulo": "Colaborador achou trilha de RH muito longa",
  "anotacao": "Durante conversa, o colaborador João mencionou que a trilha de RH tem muito conteúdo e está com dificuldade de completar no prazo.",
  "sentimento": "negativo",
  "intensidade_sentimento": 0.65,
  "contexto": {
    "conversa_id": "conv-123",
    "momento_onboarding": "dia_3",
    "topico": "prazo_trilha",
    "mensagem_original": "Essa trilha tá muito grande..."
  },
  "tags": ["prazo", "volume_conteudo", "rh"]
}
```

---

### 2. **Análise de Sentimento** - Tabela `colaborador_sentimentos`

```sql
CREATE TABLE colaborador_sentimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  colaborador_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Sentimento capturado
  sentimento VARCHAR(20) NOT NULL CHECK (sentimento IN (
    'muito_positivo',  -- 😄 Entusiasmado, animado
    'positivo',        -- 🙂 Satisfeito, tranquilo
    'neutro',          -- 😐 Indiferente
    'negativo',        -- 😟 Preocupado, frustrado
    'muito_negativo'   -- 😞 Desmotivado, ansioso
  )),
  
  -- Intensidade do sentimento (0.00 = fraco, 1.00 = muito forte)
  intensidade DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  
  -- Contexto da captura
  origem VARCHAR(50) NOT NULL CHECK (origem IN (
    'primeiro_contato',      -- Primeira interação com agente
    'durante_conversa',      -- Durante conversa normal
    'pos_trilha',            -- Após completar trilha
    'pos_quiz',              -- Após realizar quiz
    'feedback_explicito',    -- Colaborador deu feedback direto
    'analise_automatica'     -- Análise automática de mensagens
  )),
  
  -- Dados da análise
  mensagem_analisada TEXT, -- Mensagem que gerou a análise
  fatores_detectados JSONB, -- {palavras_chave: [], tom: '', emojis: []}
  
  -- Contexto adicional
  trilha_id UUID REFERENCES trilhas(id),
  momento_onboarding VARCHAR(50), -- 'inicio', 'meio', 'fim'
  dia_onboarding INTEGER, -- Dia de onboarding (1, 2, 3...)
  
  -- Ação tomada pelo agente
  acao_agente VARCHAR(100), -- 'mudou_tom', 'ofereceu_ajuda', 'enviou_motivacao'
  resposta_adaptada TEXT, -- Como o agente adaptou a resposta
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_colaborador_sentimentos_tenant ON colaborador_sentimentos(tenant_id);
CREATE INDEX idx_colaborador_sentimentos_colaborador ON colaborador_sentimentos(colaborador_id);
CREATE INDEX idx_colaborador_sentimentos_sentimento ON colaborador_sentimentos(sentimento);
CREATE INDEX idx_colaborador_sentimentos_origem ON colaborador_sentimentos(origem);
CREATE INDEX idx_colaborador_sentimentos_data ON colaborador_sentimentos(created_at);
CREATE INDEX idx_colaborador_sentimentos_colaborador_data ON colaborador_sentimentos(colaborador_id, created_at);
```

**Exemplo de uso:**
```json
{
  "sentimento": "negativo",
  "intensidade": 0.72,
  "origem": "durante_conversa",
  "mensagem_analisada": "Tá difícil entender esse conteúdo, não sei se vou conseguir...",
  "fatores_detectados": {
    "palavras_chave": ["difícil", "não sei", "conseguir"],
    "tom": "inseguro",
    "emojis": ["😕"],
    "confianca_analise": 0.85
  },
  "trilha_id": "uuid-trilha-rh",
  "momento_onboarding": "meio",
  "dia_onboarding": 4,
  "acao_agente": "ofereceu_ajuda_personalizada",
  "resposta_adaptada": "Entendo que está com dificuldade. Que tal eu te explicar de um jeito mais simples? Posso te ajudar com isso! 😊"
}
```

**Nova coluna em `users` - Sentimento Atual:**
```sql
ALTER TABLE users ADD COLUMN sentimento_atual VARCHAR(20) 
  CHECK (sentimento_atual IN ('muito_positivo', 'positivo', 'neutro', 'negativo', 'muito_negativo'));
  
ALTER TABLE users ADD COLUMN sentimento_atualizado_em TIMESTAMP WITH TIME ZONE;
```

---

### 3. **Trilhas por Cargo/Departamento** - Modificações em `trilhas`

```sql
-- Adicionar colunas de segmentação à tabela trilhas
ALTER TABLE trilhas ADD COLUMN segmentacao_tipo VARCHAR(30) NOT NULL DEFAULT 'todos'
  CHECK (segmentacao_tipo IN ('todos', 'departamentos', 'cargos', 'departamentos_cargos'));

ALTER TABLE trilhas ADD COLUMN segmentacao_config JSONB;

-- Exemplos de configuração:
-- Para todos: segmentacao_tipo = 'todos', segmentacao_config = null
-- Para departamentos específicos: segmentacao_tipo = 'departamentos', 
--   segmentacao_config = {"department_ids": ["uuid1", "uuid2"]}
-- Para cargos específicos: segmentacao_tipo = 'cargos',
--   segmentacao_config = {"position_ids": ["uuid1", "uuid2"]}
-- Para combinação: segmentacao_tipo = 'departamentos_cargos',
--   segmentacao_config = {
--     "regras": [
--       {"department_id": "uuid-dev", "position_ids": ["uuid-coord", "uuid-gerente"]},
--       {"department_id": "uuid-rh", "position_ids": ["uuid-analista"]}
--     ]
--   }
```

**Tabela auxiliar para melhor performance (opcional):**
```sql
CREATE TABLE trilha_segmentacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trilha_id UUID NOT NULL REFERENCES trilhas(id) ON DELETE CASCADE,
  
  -- Segmentação (pelo menos um deve estar preenchido)
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  position_id UUID REFERENCES positions(id) ON DELETE CASCADE,
  
  -- Se true, todos do departamento/cargo têm acesso
  -- Se false, é uma exceção (não tem acesso)
  incluir BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garante que não haverá duplicatas
  UNIQUE(trilha_id, department_id, position_id)
);

CREATE INDEX idx_trilha_segmentacao_trilha ON trilha_segmentacao(trilha_id);
CREATE INDEX idx_trilha_segmentacao_dept ON trilha_segmentacao(department_id);
CREATE INDEX idx_trilha_segmentacao_position ON trilha_segmentacao(position_id);
```

---

## 🔄 Fluxos de Integração

### Fluxo 1: Agente faz anotação durante conversa

```
1. Colaborador envia mensagem → N8N recebe
2. N8N analisa mensagem com Google Gemini (sentimento + contexto)
3. N8N registra em agente_anotacoes via API
4. Se anotação for relevante → registra também em colaborador_sentimentos
5. N8N adapta resposta baseado no sentimento
6. Periodicamente (1x/semana), N8N analisa anotações acumuladas
7. Gera sugestões em onboarding_improvements
```

### Fluxo 2: Captura de sentimento em tempo real

```
1. Mensagem chega → Análise de sentimento (Google Gemini)
2. Registra em colaborador_sentimentos
3. Atualiza sentimento_atual em users
4. Agente verifica sentimento_atual antes de responder
5. Adapta tom da resposta:
   - muito_negativo → Tom empático, oferece ajuda
   - negativo → Tom compreensivo, sugestões
   - neutro → Tom profissional padrão
   - positivo → Tom motivador, reconhecimento
   - muito_positivo → Tom celebrativo, parabenizações
```

### Fluxo 3: Roteamento de trilhas por cargo/departamento

```
1. Novo colaborador cadastrado com cargo e departamento
2. Sistema busca trilhas aplicáveis:
   SELECT * FROM trilhas t
   WHERE t.tenant_id = $1
   AND t.ativo = true
   AND (
     t.segmentacao_tipo = 'todos'
     OR (t.segmentacao_tipo = 'departamentos' 
         AND t.segmentacao_config->>'department_ids' @> $2)
     OR (t.segmentacao_tipo = 'cargos' 
         AND t.segmentacao_config->>'position_ids' @> $3)
     OR (t.segmentacao_tipo = 'departamentos_cargos' 
         AND ... regras complexas ...)
   )
3. Cria registros em colaborador_trilhas
4. Agente orienta colaborador sobre suas trilhas
```

---

## 📊 Queries Úteis

### Análise de sentimentos ao longo do tempo
```sql
SELECT 
  u.name,
  cs.sentimento,
  cs.intensidade,
  cs.dia_onboarding,
  cs.origem,
  cs.created_at
FROM colaborador_sentimentos cs
JOIN users u ON cs.colaborador_id = u.id
WHERE cs.colaborador_id = $1
ORDER BY cs.created_at DESC;
```

### Sentimento médio por trilha
```sql
SELECT 
  t.nome,
  COUNT(DISTINCT cs.colaborador_id) as total_colaboradores,
  AVG(CASE 
    WHEN cs.sentimento = 'muito_positivo' THEN 5
    WHEN cs.sentimento = 'positivo' THEN 4
    WHEN cs.sentimento = 'neutro' THEN 3
    WHEN cs.sentimento = 'negativo' THEN 2
    WHEN cs.sentimento = 'muito_negativo' THEN 1
  END) as sentimento_medio
FROM trilhas t
LEFT JOIN colaborador_sentimentos cs ON cs.trilha_id = t.id
WHERE t.tenant_id = $1
GROUP BY t.id, t.nome
ORDER BY sentimento_medio DESC;
```

### Anotações relevantes que ainda não geraram melhorias
```sql
SELECT 
  aa.tipo,
  aa.titulo,
  aa.anotacao,
  aa.sentimento,
  COUNT(*) as frequencia
FROM agente_anotacoes aa
WHERE aa.tenant_id = $1
  AND aa.relevante = true
  AND aa.gerou_melhoria = false
  AND aa.created_at >= NOW() - INTERVAL '30 days'
GROUP BY aa.tipo, aa.titulo, aa.anotacao, aa.sentimento
HAVING COUNT(*) >= 3  -- Padrão: 3 ou mais ocorrências
ORDER BY frequencia DESC;
```

### Trilhas disponíveis para um colaborador
```sql
SELECT 
  t.*
FROM trilhas t
JOIN users u ON u.tenant_id = t.tenant_id
WHERE u.id = $1
  AND t.ativo = true
  AND (
    t.segmentacao_tipo = 'todos'
    OR (t.segmentacao_tipo = 'departamentos' 
        AND t.segmentacao_config->'department_ids' @> 
            to_jsonb(ARRAY[u.department_id::text]))
    OR (t.segmentacao_tipo = 'cargos' 
        AND t.segmentacao_config->'position_ids' @> 
            to_jsonb(ARRAY[u.position_id::text]))
  );
```

---

## 🚀 Plano de Implementação

### Fase 1: Trilhas por Cargo/Departamento (Semana 1-2)
**Prioridade:** ALTA  
**Complexidade:** MÉDIA

**Tarefas:**
1. ✅ Criar migração SQL com novas colunas em `trilhas`
2. ✅ Criar tabela `trilha_segmentacao` (opcional)
3. ✅ Atualizar API backend:
   - Endpoint para configurar segmentação de trilhas
   - Endpoint para buscar trilhas aplicáveis a um colaborador
4. ✅ Atualizar interface admin:
   - Tela de configuração de trilhas com segmentação
   - Dropdown para selecionar departamentos/cargos
5. ✅ Atualizar N8N workflow:
   - Lógica para determinar trilhas do colaborador
   - Orientação personalizada

**Entregáveis:**
- Migração SQL executada
- API funcional
- Interface admin atualizada
- Workflow N8N adaptado

---

### Fase 2: Análise de Sentimento (Semana 3-4)
**Prioridade:** ALTA  
**Complexidade:** MÉDIA-ALTA

**Tarefas:**
1. ✅ Criar migração SQL:
   - Tabela `colaborador_sentimentos`
   - Novas colunas em `users`
2. ✅ Integrar análise de sentimento:
   - OpenAI API para análise de texto
   - Ou Google Vertex AI (Natural Language API)
3. ✅ Atualizar N8N workflow:
   - Nó de análise de sentimento
   - Lógica de adaptação de tom
   - Registro automático em banco
4. ✅ Criar endpoints de API:
   - Histórico de sentimentos do colaborador
   - Sentimento atual
5. ✅ Dashboard admin:
   - Visualização de sentimentos
   - Gráficos de evolução emocional
   - Alertas para sentimentos muito negativos

**Entregáveis:**
- Sistema de análise de sentimento funcionando
- Agente adaptando tom de comunicação
- Dashboard de monitoramento

---

### Fase 3: Bloco de Notas do Agente (Semana 5-6)
**Prioridade:** MÉDIA  
**Complexidade:** ALTA

**Tarefas:**
1. ✅ Criar migração SQL:
   - Tabela `agente_anotacoes`
2. ✅ Atualizar N8N workflow:
   - Lógica para criar anotações relevantes
   - Análise periódica de padrões
   - Geração automática de melhorias
3. ✅ Criar endpoints de API:
   - CRUD de anotações
   - Busca por tags, tipo, sentimento
   - Análise de padrões
4. ✅ Interface admin:
   - Visualização de anotações do agente
   - Insights automáticos
   - Dashboard de melhorias sugeridas
5. ✅ Integração com `onboarding_improvements`:
   - Link entre anotações e melhorias
   - Workflow de aprovação

**Entregáveis:**
- Sistema de memória do agente funcionando
- Dashboard de insights
- Sugestões automáticas de melhoria

---

## 📈 Impacto Esperado

### Métricas de Sucesso

| Métrica | Antes | Meta |
|---------|-------|------|
| **Taxa de Conclusão de Trilhas** | 70% | 85% |
| **Satisfação do Colaborador (NPS)** | 6.5/10 | 8.5/10 |
| **Tempo Médio de Onboarding** | 15 dias | 10 dias |
| **Redução de Dúvidas Repetitivas** | - | 40% |
| **Melhorias Implementadas/Mês** | 0 | 5-10 |

### Valor Agregado

**Para o Colaborador:**
- ✨ Experiência personalizada
- 💬 Comunicação empática
- 🎯 Conteúdo relevante para seu cargo

**Para o Gestor:**
- 📊 Insights sobre processo de onboarding
- 🔍 Identificação de gargalos
- 🚀 Melhoria contínua automatizada

**Para o Produto:**
- 🏆 Diferenciação competitiva clara
- 💎 Valor percebido maior
- 📈 Retenção de clientes

---

## 🔐 Considerações de Segurança e Privacidade

1. **LGPD/GDPR Compliance:**
   - Dados de sentimento são considerados dados sensíveis
   - Necessário consentimento explícito do colaborador
   - Implementar anonimização em relatórios agregados

2. **Retenção de Dados:**
   - Anotações: 2 anos
   - Sentimentos: 1 ano após fim do onboarding
   - Política de exclusão automática

3. **Acesso:**
   - Anotações sensíveis: apenas admin e sistema
   - Sentimentos agregados: gestores
   - Dados individuais: requerem permissão especial

---

## 📚 Próximos Passos

1. ✅ Revisar e aprovar esta proposta
2. ✅ Priorizar fases de implementação
3. ✅ Criar migrações SQL
4. ✅ Desenvolver APIs backend
5. ✅ Atualizar workflows N8N
6. ✅ Desenvolver interfaces admin
7. ✅ Testar com grupo piloto
8. ✅ Rollout gradual

---

**Criado por:** Haendell + AI Assistant  
**Última atualização:** 10 de outubro de 2025

