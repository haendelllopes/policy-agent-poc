# ✅ Checklist de Implementação - Melhorias Flowly

**Projeto:** Flowly - Sistema de Onboarding com IA  
**Data de Início:** 10 de outubro de 2025

---

## 📋 Fase 1: Trilhas por Cargo e Departamento (Semanas 1-2)

### 🗄️ Banco de Dados
- [ ] Executar migração `006_trilhas_segmentacao.sql`
- [ ] Validar que colunas foram criadas em `trilhas`:
  - [ ] `segmentacao_tipo`
  - [ ] `segmentacao_config`
- [ ] Validar criação da tabela `trilha_segmentacao`
- [ ] Testar função `colaborador_tem_acesso_trilha()`
- [ ] Testar view `trilhas_colaborador`
- [ ] Verificar índices criados
- [ ] Validar políticas RLS

### 🔧 Backend (API)

#### Endpoints - Trilhas
- [ ] **GET** `/api/trilhas/:id/segmentacao` - Buscar configuração de segmentação
- [ ] **PUT** `/api/trilhas/:id/segmentacao` - Atualizar segmentação
- [ ] **GET** `/api/trilhas/colaborador/:userId` - Trilhas disponíveis para colaborador
- [ ] **POST** `/api/trilhas/:id/segmentacao/departamentos` - Adicionar departamentos
- [ ] **POST** `/api/trilhas/:id/segmentacao/cargos` - Adicionar cargos
- [ ] **DELETE** `/api/trilhas/:id/segmentacao/:segId` - Remover segmentação

#### Validações
- [ ] Validar que pelo menos um critério está definido
- [ ] Validar IDs de departamentos/cargos existem
- [ ] Validar permissões de admin
- [ ] Tratar erros de constraint

#### Testes
- [ ] Testar criação de trilha para "todos"
- [ ] Testar criação de trilha para departamento específico
- [ ] Testar criação de trilha para cargo específico
- [ ] Testar criação de trilha para combinação cargo+departamento
- [ ] Testar busca de trilhas por colaborador

### 🎨 Frontend (Admin)

#### Tela de Configuração de Trilhas
- [ ] Adicionar seção "Segmentação" no formulário de trilha
- [ ] Radio buttons: "Todos" | "Departamentos" | "Cargos" | "Departamentos + Cargos"
- [ ] Multi-select de departamentos (quando aplicável)
- [ ] Multi-select de cargos (quando aplicável)
- [ ] Preview de quem terá acesso à trilha
- [ ] Salvar configuração via API
- [ ] Exibir segmentação atual na lista de trilhas

#### Validações
- [ ] Não permitir salvar sem selecionar ao menos um dept/cargo
- [ ] Feedback visual de salvamento
- [ ] Mensagens de erro claras

### 🤖 N8N Workflow

#### Lógica de Roteamento
- [ ] Nó: Buscar dados do colaborador (cargo + departamento)
- [ ] Nó: Buscar trilhas aplicáveis ao colaborador
- [ ] Nó: Verificar se colaborador tem acesso à trilha
- [ ] Atualizar mensagens do agente:
  - [ ] Listar trilhas disponíveis para o colaborador
  - [ ] Orientar sobre trilhas específicas do cargo/dept
  - [ ] Explicar por que certas trilhas são recomendadas

#### Testes
- [ ] Testar com colaborador de diferentes departamentos
- [ ] Testar com colaborador de diferentes cargos
- [ ] Testar cenário sem departamento/cargo definido
- [ ] Validar que trilhas "para todos" aparecem sempre

### 📚 Documentação
- [ ] Documentar API de segmentação
- [ ] Criar guia de uso para admins
- [ ] Atualizar README com nova feature
- [ ] Criar vídeo tutorial (opcional)

---

## 📋 Fase 2: Análise de Sentimento (Semanas 3-4) ✅ **COMPLETA**

### 🗄️ Banco de Dados ✅ **COMPLETO**
- [x] Executar migração `005_colaborador_sentimentos.sql`
- [x] Validar criação da tabela `colaborador_sentimentos`
- [x] Validar colunas adicionadas em `users`:
  - [x] `sentimento_atual`
  - [x] `sentimento_atualizado_em`
- [x] Testar trigger `trigger_atualizar_sentimento_usuario`
- [x] Verificar índices criados
- [x] Validar políticas RLS

### 🤖 Integração de IA ✅ **COMPLETO**

#### OpenAI + Google Gemini ✅ **IMPLEMENTADO**
- [x] Configurar API Keys (OpenAI + Gemini como fallback)
- [x] Configurar credenciais no N8N
- [x] Criar prompt para análise de sentimento
- [x] Testar análise com mensagens de exemplo
- [x] Ajustar prompt para melhor precisão
- [x] Implementar fallback em caso de erro
- [x] Sistema funciona com OpenAI (principal) e Gemini (fallback)
- [x] Análise simples como fallback final

#### Sistema de Análise ✅ **FUNCIONANDO**
```
✅ Análise com OpenAI (principal)
✅ Fallback para Gemini (se OpenAI falhar)
✅ Análise simples (se ambos falharem)
✅ Retorna JSON estruturado:
{
  "sentimento": "muito_positivo|positivo|neutro|negativo|muito_negativo",
  "intensidade": 0.00-1.00,
  "fatores_detectados": {
    "palavras_chave": [],
    "tom": "",
    "emojis": []
  }
}
```

- [x] Criar e testar prompt
- [x] Validar precisão da análise (OpenAI GPT-4)
- [x] Sistema robusto com múltiplos fallbacks
- [x] Monitorar custos (estimado ~$20-40/mês)

### 🔧 Backend (API) ✅ **COMPLETO**

#### Endpoints - Sentimentos ✅ **9 ENDPOINTS IMPLEMENTADOS**
- [x] **POST** `/api/analise-sentimento` - Análise completa (principal)
- [x] **GET** `/api/analise-sentimento/historico/:userId` - Histórico de sentimentos
- [x] **GET** `/api/analise-sentimento/estatisticas/:tenantId` - Estatísticas agregadas
- [x] **POST** `/api/analise-sentimento/recomendar-trilhas` - Recomendar trilhas por sentimento
- [x] **GET** `/api/analise-sentimento/alertas/:tenantId` - Colaboradores com sentimento negativo
- [x] **GET** `/api/trilhas-recomendadas/:userId` - Trilhas recomendadas (aceita phone)
- [x] **GET** `/api/trilhas-recomendadas/metricas/:trilhaId` - Métricas de trilha
- [x] **GET** `/api/trilhas-recomendadas/ranking/:tenantId` - Ranking de trilhas
- [x] **POST** `/api/webhooks/alerta-sentimento-negativo` - Webhook de alertas

#### Validações ✅ **IMPLEMENTADAS**
- [x] Validar formato de sentimento
- [x] Validar intensidade (0.00 - 1.00)
- [x] Validar origem do sentimento
- [x] Validar permissões
- [x] Validar tenant_id (fallback para tenant padrão)
- [x] Lookup automático de phone para user_id

#### Testes ✅ **FUNCIONANDO**
- [x] Testar registro de sentimento
- [x] Testar atualização automática em `users`
- [x] Testar busca de histórico
- [x] Testar estatísticas agregadas
- [x] Testar sistema de alertas
- [x] Testar busca de trilhas personalizadas

### 🤖 N8N Workflow ✅ **COMPLETO**

#### Nós de Análise ✅ **FUNCIONANDO**
- [x] Nó: Receber mensagem do colaborador (Merge)
- [x] Nó: Chamar API de análise de sentimento (1️⃣ Analisar Sentimento)
- [x] Nó: Parsear resposta da IA
- [x] Nó: Salvar sentimento no banco de dados (automático)
- [x] Nó: Decidir tom da resposta baseado no sentimento (3️⃣ É Negativo?)
- [x] Nó: Gerar resposta adaptada (5️⃣ AI Agent)
- [x] Nó: Buscar trilhas personalizadas (4️⃣ Buscar Trilhas)
- [x] Nó: Enviar alertas para RH (🚨 Alerta RH)
- [x] Nó: Salvar log da conversa (💾 Create Supabase)

#### Lógica de Adaptação de Tom ✅ **IMPLEMENTADA**
- [x] **Muito Negativo** → Tom empático, oferecer ajuda imediata
- [x] **Negativo** → Tom compreensivo, dar suporte
- [x] **Neutro** → Tom profissional padrão
- [x] **Positivo** → Tom motivador, dar reconhecimento
- [x] **Muito Positivo** → Tom celebrativo, parabenizar

#### Sistema de Respostas ✅ **FUNCIONANDO**
```
✅ Templates implementados no AI Agent:

NEGATIVO/MUITO_NEGATIVO:
- "Entendo sua frustração! 😊 Vamos resolver isso juntos..."
- "Percebo sua dificuldade. Estou aqui para te ajudar..."

NEUTRO:
- Resposta profissional e clara

POSITIVO/MUITO_POSITIVO:
- "Que ótimo! Continue assim! 👏"
- "Incrível! Estou muito feliz com seu progresso! 🎉"
```

- [x] Criar templates de respostas
- [x] Implementar lógica de seleção
- [x] Testar com diferentes sentimentos

#### Alertas ✅ **FUNCIONANDO**
- [x] Criar alerta para sentimento negativo/muito_negativo
- [x] Enviar notificação para gestor/RH (logs detalhados)
- [x] Sistema de alertas automático funcionando

### 🎨 Frontend (Admin) ⏳ **PRÓXIMO PASSO**

#### Dashboard de Sentimentos ⏳ **PENDENTE**
- [ ] Card: Sentimento médio dos colaboradores
- [ ] Gráfico: Evolução de sentimentos ao longo do tempo
- [ ] Gráfico: Distribuição de sentimentos
- [ ] Lista: Colaboradores com sentimento negativo (alertas)
- [ ] Filtros: Por departamento, cargo, trilha
- [ ] Detalhe: Histórico de sentimentos por colaborador

#### Detalhes do Colaborador ⏳ **PENDENTE**
- [ ] Adicionar seção "Sentimento Atual" no perfil
- [ ] Gráfico de evolução emocional
- [ ] Histórico de interações e sentimentos

### 📚 Documentação ✅ **PARCIALMENTE COMPLETA**
- [x] Documentar API de sentimentos (9 endpoints implementados)
- [x] Documentar lógica de adaptação de tom
- [x] Guia para interpretar sentimentos
- [ ] Política de privacidade atualizada (LGPD)

---

## 📋 Fase 3: Bloco de Notas do Agente (Semanas 5-6)

### 🗄️ Banco de Dados
- [ ] Executar migração `004_agente_anotacoes.sql`
- [ ] Validar criação da tabela `agente_anotacoes`
- [ ] Verificar índices criados
- [ ] Validar políticas RLS
- [ ] Testar busca por tags (índice GIN)

### 🔧 Backend (API)

#### Endpoints - Anotações
- [ ] **POST** `/api/agente/anotacoes` - Criar anotação
- [ ] **GET** `/api/agente/anotacoes/:tenantId` - Listar anotações
- [ ] **GET** `/api/agente/anotacoes/:id` - Detalhes da anotação
- [ ] **PUT** `/api/agente/anotacoes/:id` - Atualizar anotação
- [ ] **DELETE** `/api/agente/anotacoes/:id` - Remover anotação
- [ ] **GET** `/api/agente/anotacoes/colaborador/:userId` - Anotações de um colaborador
- [ ] **GET** `/api/agente/anotacoes/trilha/:trilhaId` - Anotações de uma trilha
- [ ] **GET** `/api/agente/anotacoes/padroes/:tenantId` - Padrões identificados
- [ ] **POST** `/api/agente/anotacoes/:id/gerar-melhoria` - Gerar melhoria a partir de anotação

#### Endpoints - Análise de Padrões
- [ ] **GET** `/api/agente/insights/:tenantId` - Insights automáticos
- [ ] **POST** `/api/agente/analisar-padroes/:tenantId` - Forçar análise de padrões

#### Validações
- [ ] Validar tipo de anotação
- [ ] Validar sentimento e intensidade
- [ ] Validar tags (array de strings)
- [ ] Validar permissões

#### Testes
- [ ] Testar criação de anotação
- [ ] Testar busca por tags
- [ ] Testar busca por tipo
- [ ] Testar busca por sentimento
- [ ] Testar link com melhorias

### 🤖 N8N Workflow

#### Lógica de Anotação Automática
- [ ] Nó: Detectar se mensagem contém feedback relevante
- [ ] Nó: Classificar tipo de anotação
- [ ] Nó: Extrair tags da mensagem
- [ ] Nó: Analisar sentimento da anotação
- [ ] Nó: Salvar anotação no banco
- [ ] Nó: Atualizar contador de padrões

#### Condições para Criar Anotação
```
Criar anotação quando:
✅ Colaborador menciona dificuldade
✅ Colaborador dá feedback sobre trilha
✅ Colaborador sugere melhoria
✅ Colaborador expressa sentimento forte (muito positivo/negativo)
✅ Colaborador relata problema técnico

NÃO criar anotação para:
❌ Conversas triviais ("oi", "obrigado")
❌ Confirmações simples ("sim", "ok")
❌ Perguntas já respondidas antes
```

- [ ] Implementar lógica de detecção
- [ ] Testar precisão
- [ ] Ajustar sensibilidade

#### Análise Periódica de Padrões
- [ ] Criar workflow agendado (1x/semana)
- [ ] Nó: Buscar anotações relevantes dos últimos 30 dias
- [ ] Nó: Agrupar por tipo, trilha, sentimento
- [ ] Nó: Identificar padrões (3+ ocorrências similares)
- [ ] Nó: Gerar sugestões de melhoria via IA
- [ ] Nó: Salvar em `onboarding_improvements`
- [ ] Nó: Marcar anotações como `gerou_melhoria = true`
- [ ] Nó: Notificar admins sobre novas sugestões

#### Prompt para Geração de Melhorias (Gemini)
```
Exemplo de prompt:

Model: gemini-1.5-pro (para análises mais complexas)

"Com base nas seguintes anotações do agente de IA, sugira uma melhoria 
para o processo de onboarding:

Anotações:
- João: 'Trilha de RH muito longa' (sentimento: negativo)
- Maria: 'Não consegui terminar a trilha de RH no prazo' (sentimento: negativo)
- Pedro: 'RH tem muito conteúdo' (sentimento: neutro)

Gere uma sugestão de melhoria em JSON:
{
  "titulo": "...",
  "descricao": "...",
  "categoria": "conteudo|interface|fluxo|performance|engajamento|acessibilidade|outros",
  "prioridade": "baixa|media|alta|critica",
  "impacto_estimado": "baixo|medio|alto|muito_alto",
  "esforco_estimado": "baixo|medio|alto|muito_alto"
}"
```

- [ ] Criar e testar prompt
- [ ] Validar qualidade das sugestões (Gemini 1.5 Pro é excelente nisso)
- [ ] Ajustar conforme necessário

### 🎨 Frontend (Admin)

#### Dashboard de Anotações
- [ ] Card: Total de anotações relevantes
- [ ] Card: Padrões identificados
- [ ] Card: Melhorias geradas
- [ ] Lista: Anotações recentes
- [ ] Filtros: Por tipo, sentimento, colaborador, trilha, tags
- [ ] Busca por tags

#### Dashboard de Insights
- [ ] Card: Insights da semana
- [ ] Lista: Padrões identificados
- [ ] Lista: Melhorias sugeridas (pendentes)
- [ ] Gráfico: Tipos de feedback mais comuns
- [ ] Gráfico: Sentimentos sobre trilhas

#### Tela de Detalhes da Anotação
- [ ] Exibir informações completas
- [ ] Histórico de anotações relacionadas
- [ ] Botão: "Gerar Melhoria a partir desta anotação"
- [ ] Link para melhoria gerada (se existir)

#### Tela de Melhorias Sugeridas
- [ ] Integrar com `onboarding_improvements` existente
- [ ] Exibir anotações que geraram a melhoria
- [ ] Botão: "Aprovar e Implementar"
- [ ] Botão: "Rejeitar"
- [ ] Campo: "Observações"

### 📚 Documentação
- [ ] Documentar API de anotações
- [ ] Documentar lógica de detecção de padrões
- [ ] Guia para interpretar insights
- [ ] Exemplos de melhorias geradas

---

## 📋 Testes Gerais e Validação

### Testes de Integração
- [ ] Testar fluxo completo: mensagem → sentimento → anotação → melhoria
- [ ] Testar com diferentes perfis de colaboradores
- [ ] Testar com diferentes tipos de trilhas
- [ ] Validar performance com grande volume de dados

### Testes de Usabilidade
- [ ] Testar com admins reais
- [ ] Testar com colaboradores reais
- [ ] Coletar feedback
- [ ] Ajustar UX conforme necessário

### Testes de Performance
- [ ] Benchmark de análise de sentimento
- [ ] Benchmark de busca de trilhas
- [ ] Benchmark de análise de padrões
- [ ] Otimizar queries lentas

### Testes de Segurança
- [ ] Validar RLS em todas as tabelas
- [ ] Testar injeção SQL
- [ ] Testar acesso não autorizado
- [ ] Validar sanitização de inputs

---

## 📋 Preparação para Produção

### Infraestrutura
- [ ] Validar limites de API (OpenAI/Vertex)
- [ ] Configurar rate limiting
- [ ] Configurar monitoramento de erros
- [ ] Configurar logs estruturados
- [ ] Configurar alertas de performance

### Dados
- [ ] Backup antes de migrações
- [ ] Plano de rollback
- [ ] Script de migração de dados legados (se necessário)

### Documentação
- [ ] Atualizar documentação técnica
- [ ] Criar guia de troubleshooting
- [ ] Documentar decisões arquiteturais
- [ ] Changelog atualizado

### Treinamento
- [ ] Treinar equipe de suporte
- [ ] Criar materiais de treinamento para admins
- [ ] Criar FAQs
- [ ] Criar vídeos tutoriais

---

## 📋 Rollout

### Grupo Piloto (Semana 7)
- [ ] Selecionar 2-3 clientes beta
- [ ] Comunicar novidades
- [ ] Ativar features
- [ ] Monitorar métricas
- [ ] Coletar feedback
- [ ] Ajustar conforme necessário

### Rollout Gradual (Semana 8-9)
- [ ] Ativar para 25% dos clientes
- [ ] Monitorar 3 dias
- [ ] Ativar para 50% dos clientes
- [ ] Monitorar 3 dias
- [ ] Ativar para 100% dos clientes

### Comunicação
- [ ] Email para clientes sobre novidades
- [ ] Post no blog/changelog
- [ ] Atualizar materiais de marketing
- [ ] Atualizar demos

---

## 📊 Métricas de Acompanhamento

### Diárias
- [ ] Número de sentimentos capturados
- [ ] Número de anotações criadas
- [ ] Taxa de erro da API de IA
- [ ] Performance de queries

### Semanais
- [ ] Distribuição de sentimentos
- [ ] Padrões identificados
- [ ] Melhorias sugeridas
- [ ] Taxa de conclusão de trilhas

### Mensais
- [ ] NPS dos colaboradores
- [ ] Tempo médio de onboarding
- [ ] Melhorias implementadas
- [ ] ROI das melhorias

---

## ✅ Critérios de Sucesso Final

### Funcionalidade ✅ **FASE 2 COMPLETA**
- ✅ Sistema de análise de sentimento funcionando
- ✅ APIs robustas com fallbacks
- ✅ Workflow N8N completo
- ✅ Sistema de alertas automático
- ✅ Busca de trilhas personalizadas

### Negócio ✅ **EM PRODUÇÃO**
- ✅ Sistema funcionando em produção
- ✅ Alertas automáticos para RH
- ✅ IA adapta tom baseado no sentimento
- ✅ Trilhas recomendadas por sentimento
- ⏳ Dashboard de sentimentos (próximo passo)

### Técnico ✅ **SÓLIDO**
- ✅ Documentação da API completa
- ✅ Código com fallbacks robustos
- ✅ Sistema testado e validado
- ✅ Deploy funcionando no Vercel

---

## 🎉 **CONQUISTAS DA FASE 2:**

### ✅ **Sistema Completo de Análise de Sentimento:**
- 🧠 **9 endpoints** implementados e funcionando
- 🤖 **Workflow N8N** completo com 6 nós
- 🚨 **Alertas automáticos** para RH
- 📚 **Trilhas personalizadas** por sentimento
- 🎯 **IA adapta tom** da resposta
- 📊 **Logs completos** para análise

### 🚀 **Próximos Passos:**
1. **Criar mais trilhas** no banco (melhorar recomendações)
2. **Dashboard de sentimentos** (6-8h)
3. **Notificações por email** (2h)
4. **Análise periódica** de padrões (4h)

---

**Última atualização:** 10 de outubro de 2025  
**Status:** ✅ **FASE 2 COMPLETA - Sistema funcionando em produção**  
**Responsável:** Haendell Lopes

