# 📋 Checklist de Implementação - Flowly

**Projeto:** Navigator - Sistema de Onboarding com IA  
**Data de Início:** 10 de outubro de 2025  
**Última Atualização:** 15 de outubro de 2025

---

## 📚 **HISTÓRICO DE IMPLEMENTAÇÕES**

**✅ Fases 1, 2, 3 e Brand Manual CONCLUÍDAS** - Ver detalhes completos em: [`HISTORICO_IMPLEMENTACOES.md`](./HISTORICO_IMPLEMENTACOES.md)

**Resumo das Conquistas:**
- ✅ **Fase 1:** Sentiment Analysis Nativo (4h) - 50% mais rápido, 85% mais barato
- ✅ **Fase 2:** Information Extractor (3h) - 12+ campos estruturados automáticos  
- ✅ **Fase 3:** Agente Conversacional GPT-4o (5h) - 4 ferramentas conectadas
- ✅ **Brand Manual Navi:** Identidade visual completa (3h) - 87% redução de código CSS, 100% aderência ao manual oficial

**Total:** 75 tarefas implementadas, 20 arquivos criados/modificados, sistema básico → sistema inteligente + identidade visual profissional

---

## 🎨 **BRAND MANUAL NAVI** ✅ (Movido para Histórico)
Ver detalhes completos em: [`HISTORICO_IMPLEMENTACOES.md`](./HISTORICO_IMPLEMENTACOES.md)

---

## 🚧 **TAREFAS PENDENTES**

> 📘 **GUIA DETALHADO:** Ver implementação completa com código, testes e troubleshooting em: [`GUIA_DETALHADO_IMPLEMENTACAO.md`](./GUIA_DETALHADO_IMPLEMENTACAO.md)

 

### 🎯 **PRIORIDADE MÁXIMA: FASE 4.5 - APRIMORAMENTO DE ANOTAÇÕES** (6-8h)

**Objetivo:** Transformar anotações básicas em sistema inteligente com categorização automática, detecção de urgência, análise de padrões e anotações proativas.

**📘 Documentação Completa:** [Seção 4.5 do Guia Detalhado](./GUIA_DETALHADO_IMPLEMENTACAO.md#45-aprimoramento-de-anotações)

#### **4.5.1. Categorização Inteligente de Feedback** (3-4h)

##### Subtarefa 1.1: Criar Code Node "Analisar Feedback com GPT-4o" (1.5h)
- [ ] **N8N - Adicionar Code Node**
  - [ ] Posição: APÓS `Tem feedback?` (TRUE branch), ANTES `💾 Salvar Anotação`
  - [ ] Nome do nó: `Analisar Feedback com GPT-4o`
  - [ ] Tipo: Code (JavaScript)
  
- [ ] **Implementar código (ver doc linhas 50-200)**
  - [ ] Importar axios: `const axios = require('axios')`
  - [ ] Extrair dados: mensagem, sentimento, intensidade, from, tenantId
  - [ ] Configurar OpenAI API Key (substituir `sk-proj-...`)
  - [ ] Configurar modelo: `gpt-4o-mini`
  - [ ] Configurar parâmetros: temp=0.3, max_tokens=500
  - [ ] Implementar prompt de análise semântica
  - [ ] Parser de resposta JSON (com tratamento de erro)
  - [ ] Fallback em caso de erro
  
- [ ] **Validar saída do nó**
  - [ ] ✅ Retorna: tipo, urgencia, categoria, subcategoria
  - [ ] ✅ Retorna: tags (array 5+), sentimento_contexto
  - [ ] ✅ Retorna: acao_sugerida, impacto_estimado, titulo_sugerido
  - [ ] ✅ Metadata: analisado_em, modelo_usado, versao_analise

##### Subtarefa 1.2: Atualizar nó "💾 Salvar Anotação" (1h)
- [ ] **Expandir campos aceitos**
  - [ ] Adicionar 9 novos campos ao JSON body
  - [ ] Atualizar referências para usar dados do Code Node anterior
  - [ ] Validar que todos os campos são enviados corretamente
  
- [ ] **Atualizar Backend (se necessário)**
  - [ ] Verificar se endpoint `/api/agente/anotacoes` aceita novos campos
  - [ ] Se não aceitar, atualizar INSERT query na tabela `agente_anotacoes`
  - [ ] Adicionar colunas: `tipo`, `urgencia`, `categoria`, `subcategoria`, `tags`, `sentimento_contexto`, `acao_sugerida`, `impacto_estimado`, `titulo_sugerido`

##### Subtarefa 1.3: Testes de Categorização (0.5h)
- [ ] **Teste 1: Feedback Construtivo**
  - [ ] Mensagem: "A trilha de compliance está muito longa, poderia ser dividida em módulos menores"
  - [ ] Verificar: tipo=melhoria, urgencia=media, categoria=trilha, tags=["compliance", "melhoria", "estrutura"]
  
- [ ] **Teste 2: Problema Urgente**
  - [ ] Mensagem: "Não consigo acessar o sistema há 2 dias, isso está atrasando meu onboarding"
  - [ ] Verificar: tipo=problema, urgencia=alta, categoria=tecnico, tags=["acesso", "problema", "urgente"]
  
- [ ] **Teste 3: Elogio**
  - [ ] Mensagem: "Adorei a trilha de boas-vindas, muito bem estruturada e interativa"
  - [ ] Verificar: tipo=elogio, urgencia=baixa, categoria=trilha, tags=["elogio", "boas-vindas", "satisfacao"]

#### **4.5.2. Detecção de Urgência Automática** (2-3h)

##### Subtarefa 2.1: Criar Lógica de Urgência no N8N (1h)
- [ ] **Adicionar IF Node "🚨 Analisar Urgência"**
  - [ ] Posição: APÓS Code Node "Analisar Feedback", ANTES `💾 Salvar Anotação`
  - [ ] Condição 1: `urgencia === 'critica'` → Branch "CRÍTICA"
  - [ ] Condição 2: `urgencia === 'alta'` → Branch "ALTA"
  - [ ] Condição 3: `urgencia === 'media'` → Branch "MÉDIA"
  - [ ] Condição 4: `urgencia === 'baixa'` → Branch "BAIXA"
  
- [ ] **Branch CRÍTICA - Notificação Imediata**
  - [ ] HTTP Request "Notificar Admin"
    - [ ] URL: `{{ $('BACKEND_URL').item.json.url }}/api/agente/alertas/urgencia-critica`
    - [ ] Body: `{ "phone": "{{ $('Merge').item.json.from }}", "urgencia": "critica", "feedback": "{{ $('Merge').item.json.messageText }}", "categoria": "{{ $('Analisar Feedback com GPT-4o').item.json.categoria }}", "timestamp": "{{ new Date().toISOString() }}" }`
  
  - [ ] Code Node "Preparar Ticket"
    - [ ] Extrair dados críticos
    - [ ] Formatar para sistema de tickets
  
  - [ ] HTTP Request "Criar Ticket"
    - [ ] URL: `{{ $('BACKEND_URL').item.json.url }}/api/tickets`
    - [ ] Criar ticket automático com prioridade máxima

##### Subtarefa 2.2: Backend - Endpoints de Urgência (1h)
- [ ] **POST /api/agente/alertas/urgencia-critica**
  - [ ] Buscar administradores do tenant
  - [ ] Criar notificação urgente
  - [ ] Enviar email de alerta
  - [ ] Salvar log de emergência
  
- [ ] **POST /api/tickets**
  - [ ] Validar campos obrigatórios
  - [ ] Inserir na tabela `tickets` ou `support_requests`
  - [ ] Notificar responsável técnico
  - [ ] Retornar ID do ticket criado

##### Subtarefa 2.3: Testes de Urgência (0.5h)
- [ ] **Teste 1: Urgência Crítica**
  - [ ] Simular feedback crítico
  - [ ] Verificar notificação admin
  - [ ] Verificar criação de ticket
  
- [ ] **Teste 2: Urgência Alta**
  - [ ] Simular feedback de alta urgência
  - [ ] Verificar que não cria ticket automático
  - [ ] Verificar que salva anotação normalmente

#### **4.5.3. Análise de Padrões com GPT-4o** (3-4h)

##### Subtarefa 3.1: Criar Workflow de Análise Diária (2h)
- [ ] **Criar Workflow "Análise Diária de Padrões"**
  - [ ] Cron Trigger: "0 9 * * *" (9h da manhã, diário)
  - [ ] Nó: Buscar Anotações dos Últimos 7 dias
  - [ ] Nó: Preparar Dados (Code Node)
  - [ ] Nó: GPT-4 Análise (HTTP Request)
  - [ ] Nó: Processar Resposta (Code Node)
  - [ ] Nó: Salvar Melhorias (HTTP Request)
  
- [ ] **Code Node "Preparar Dados"**
  - [ ] Agrupar anotações por tipo, categoria, sentimento
  - [ ] Contar frequências
  - [ ] Identificar padrões temporais
  - [ ] Formatar para análise de IA
  
- [ ] **HTTP Request "GPT-4 Análise"**
  - [ ] URL: `https://api.openai.com/v1/chat/completions`
  - [ ] Model: `gpt-4o`
  - [ ] Prompt: Análise de padrões e sugestões de melhoria
  - [ ] Max tokens: 1000

##### Subtarefa 3.2: Backend - Endpoint de Melhorias (1h)
- [ ] **POST /api/agente/melhorias**
  - [ ] Aceitar sugestões de melhoria da IA
  - [ ] Salvar na tabela `onboarding_improvements`
  - [ ] Campos: `tipo`, `descricao`, `prioridade`, `impacto_estimado`, `dados_origem`
  - [ ] Notificar administradores sobre novas sugestões

##### Subtarefa 3.3: Teste Completo (0.5h)
- [ ] **Executar workflow manualmente**
  - [ ] Verificar busca de anotações
  - [ ] Verificar análise de IA
  - [ ] Verificar salvamento de melhorias
  - [ ] Verificar notificações

#### **4.5.4. Anotações Proativas (Auto-geradas)** (2-3h)

##### Subtarefa 4.1: Workflow de Monitoramento (1.5h)
- [ ] **Criar Workflow "Monitoramento Proativo"**
  - [ ] Cron Trigger: "0 */6 * * *" (4x por dia)
  - [ ] Nó: Buscar Colaboradores Ativos
  - [ ] Nó: Analisar Comportamento (5 padrões)
  - [ ] Nó: Enriquecer com GPT-4 (Loop)
  - [ ] Nó: Salvar Anotações Proativas
  
- [ ] **Code Node "Analisar Comportamento"**
  - [ ] Padrão 1: Inatividade (5+ dias sem interação)
  - [ ] Padrão 2: Progresso excepcional (concluiu 3+ trilhas em 1 semana)
  - [ ] Padrão 3: Sentimento consistentemente negativo (3+ dias)
  - [ ] Padrão 4: Acesso frequente a mesma trilha (10+ vezes)
  - [ ] Padrão 5: Horário de acesso atípico (madrugada/fins de semana)

##### Subtarefa 4.2: Backend - Endpoint Proativo (0.5h)
- [ ] **POST /api/agente/anotacoes/proativa**
  - [ ] Aceitar anotações geradas automaticamente
  - [ ] Marcar com flag `proativa = true`
  - [ ] Incluir metadata de padrão detectado

##### Subtarefa 4.3: Testes Proativos (0.5h)
- [ ] **Teste 1: Inatividade**
  - [ ] Simular colaborador inativo há 6 dias
  - [ ] Verificar geração de anotação proativa
  
- [ ] **Teste 2: Progresso Excepcional**
  - [ ] Simular colaborador que concluiu 4 trilhas em 5 dias
  - [ ] Verificar anotação de reconhecimento

---

### 🚀 **EVOLUTION API - WHATSAPP ILIMITADO GRATUITO** (8-10h)

**Objetivo:** Implementar Evolution API para testes em massa sem custos, mantendo WhatsApp Business para produção.

**📘 Documentação Completa:** [`EVOLUTION_API_SETUP.md`](./EVOLUTION_API_SETUP.md) e [`N8N_EVOLUTION_INTEGRATION.md`](./N8N_EVOLUTION_INTEGRATION.md)

#### **EVOLUTION.1. Instalação e Configuração** (3-4h)

##### Subtarefa 1.1: Setup Evolution API (1.5h)
- [ ] **Instalar Evolution API via Docker**
  - [ ] Criar arquivo `docker-compose.evolution.yml`
  - [ ] Configurar variáveis de ambiente
  - [ ] Executar `docker-compose up -d`
  - [ ] Verificar saúde da API (`/manager/health`)
  
- [ ] **Configurar instância WhatsApp**
  - [ ] Criar instância `navigator-whatsapp`
  - [ ] Obter QR Code para conectar WhatsApp
  - [ ] Conectar WhatsApp pessoal para testes
  - [ ] Verificar status de conexão

##### Subtarefa 1.2: Script de Automação (1h)
- [ ] **Executar script automatizado**
  - [ ] Usar `scripts/evolution-setup.sh`
  - [ ] Configurar API Key: `navigator-evolution-key-2025-secure`
  - [ ] Testar envio de mensagem inicial
  - [ ] Salvar QR Code em `qr-code-navigator.png`

##### Subtarefa 1.3: Configuração de Segurança (0.5h)
- [ ] **Configurar variáveis de ambiente**
  - [ ] Adicionar `EVOLUTION_API_URL` ao `.env`
  - [ ] Adicionar `EVOLUTION_API_KEY` ao `.env`
  - [ ] Configurar firewall (se necessário)
  - [ ] Testar acesso externo (opcional)

#### **EVOLUTION.2. Integração com N8N** (3-4h)

##### Subtarefa 2.1: Configurar Credencial N8N (0.5h)
- [ ] **Adicionar credencial Evolution API**
  - [ ] Acessar N8N: Settings → Credentials
  - [ ] Criar "HTTP Header Auth"
  - [ ] Nome: "Evolution API Navigator"
  - [ ] Header: `apikey` = `navigator-evolution-key-2025-secure`

##### Subtarefa 2.2: Implementar Dual Channel (2h)
- [ ] **Adicionar node Evolution API no workflow**
  - [ ] Criar node "HTTP Request" para Evolution API
  - [ ] URL: `http://localhost:8080/message/sendText/navigator-whatsapp`
  - [ ] Configurar autenticação via credencial
  - [ ] Testar envio de mensagem

- [ ] **Implementar lógica de escolha**
  - [ ] Code Node: "Choose Channel"
  - [ ] Lógica: Se tenant=demo OU número de teste → Evolution API
  - [ ] Caso contrário → WhatsApp Business (atual)
  - [ ] Testar ambos os fluxos

##### Subtarefa 2.3: Webhook para Receber Mensagens (1h)
- [ ] **Configurar webhook Evolution API**
  - [ ] Webhook URL: `https://hndll.app.n8n.cloud/webhook/evolution-webhook`
  - [ ] Eventos: `MESSAGES_UPSERT`, `CONNECTION_UPDATE`
  - [ ] Criar node "Evolution Webhook Receiver" no N8N
  - [ ] Processar mensagens recebidas

##### Subtarefa 2.4: Fallback Inteligente (0.5h)
- [ ] **Implementar fallback automático**
  - [ ] Tentar Evolution API primeiro
  - [ ] Se falhar → usar WhatsApp Business
  - [ ] Log de fallbacks para monitoramento
  - [ ] Testar cenários de falha

#### **EVOLUTION.3. Testes e Validação** (1-2h)

##### Subtarefa 3.1: Testes Básicos (0.5h)
- [ ] **Teste 1: Envio via Evolution API**
  - [ ] Enviar mensagem para número de teste
  - [ ] Verificar recebimento no WhatsApp
  - [ ] Validar logs do N8N

- [ ] **Teste 2: Recebimento de mensagem**
  - [ ] Enviar mensagem do WhatsApp para Evolution API
  - [ ] Verificar processamento no N8N
  - [ ] Validar resposta automática

##### Subtarefa 3.2: Testes de Integração (1h)
- [ ] **Teste 3: Fluxo completo**
  - [ ] Colaborador inicia trilha
  - [ ] Backend dispara webhook
  - [ ] N8N processa e envia via Evolution API
  - [ ] Colaborador recebe e responde
  - [ ] Sistema processa resposta

- [ ] **Teste 4: Fallback**
  - [ ] Simular falha da Evolution API
  - [ ] Verificar uso do WhatsApp Business
  - [ ] Confirmar entrega da mensagem

##### Subtarefa 3.3: Testes em Massa (0.5h)
- [ ] **Teste 5: Múltiplos usuários**
  - [ ] Adicionar 5-10 números de teste
  - [ ] Enviar mensagens simultâneas
  - [ ] Verificar performance e entrega
  - [ ] Monitorar logs de erro

#### **EVOLUTION.4. Monitoramento e Produção** (1h)

##### Subtarefa 4.1: Dashboard e Métricas (0.5h)
- [ ] **Configurar monitoramento**
  - [ ] Dashboard Evolution API: `http://localhost:8080/dashboard`
  - [ ] Métricas de mensagens enviadas/recebidas
  - [ ] Status de conexão WhatsApp
  - [ ] Logs de erro e fallbacks

##### Subtarefa 4.2: Documentação Final (0.5h)
- [ ] **Documentar implementação**
  - [ ] Atualizar README com Evolution API
  - [ ] Criar guia de troubleshooting
  - [ ] Documentar comandos de manutenção
  - [ ] Criar procedimentos de backup/restore

---

### 🔧 **NOVOS ITENS REPORTADOS EM TESTES (17/out/2025)**

#### **Prioridade P0 — Correções críticas no fluxo atual**
- [ ] **Agente AI com contexto do colaborador**
  - [ ] Incluir no contexto do agente: `nome`, `gestor` e `buddy`
  - [ ] Permitir responder perguntas como "qual é meu nome?", "quem é meu gestor?"
- [ ] **Isolamento por tenantId em todas as consultas**
  - [ ] Garantir `tenantId` em insights, colaboradores, documentos e trilhas
  - [ ] Evitar vazamento de dados entre empresas
- [ ] **Trilhas por tenant no agente**
  - [ ] As recomendações/listagens do agente devem filtrar pelo `tenantId` do colaborador
- [ ] **Ordenação de trilhas por prioridade**
  - [ ] Listar trilhas em ordem crescente de `ordem` (maior prioridade primeiro)
- [ ] **Fluxo de finalizar/reativar trilha via agente**
  - [ ] Finalizar trilha (status → `concluida`)
  - [ ] Reativar trilha (status → `aguardando`)
- [ ] **Edição de colaborador: `data_admissao`**
  - [ ] Preencher `data_admissao` no GET de edição
  - [ ] Evitar salvar `NULL` indevidamente
- [ ] **Formulário de colaborador: Gestor e Buddy**
  - [ ] Adicionar selects para escolher gestor e buddy entre usuários do tenant
- [ ] **Melhorar a entrega do link do painel do colaborador**
  - [ ] Mensagem formatada/curta com link clicável (WhatsApp/Telegram)

#### **Prioridade P1 — Aprimoramentos funcionais**
- [ ] **Middleware `requireTenant`**
  - [ ] Padronizar/forçar `tenantId` em rotas sensíveis
- [ ] **Endpoint `GET /api/users`**
  - [ ] Listar usuários do tenant (popular selects de Gestor/Buddy)
- [ ] **Endpoint `GET /api/agent/colaborador/:id`**
  - [ ] Retornar nome, gestor, buddy, cargo, departamento, data_admissao
- [ ] **Endpoint `POST /api/trilhas/full`**
  - [ ] Criar trilha e conteúdos em uma transação única
- [ ] **Validação de prioridade de trilhas**
  - [ ] Tornar `ordem` obrigatório no formulário/admin de trilhas
- [ ] **Testes de negação de acesso entre tenants**
  - [ ] Garantir bloqueio de acesso cruzado (403/404)

#### **Prioridade P2 — UX e documentação**
- [ ] **Unificar UI de criação de trilha**
  - [ ] Criar trilha e adicionar conteúdos no mesmo formulário (manter opção de editar depois)
- [ ] **Documentação**
  - [ ] Atualizar este checklist com status dos novos itens
  - [ ] Atualizar README e docs do N8N (novas ferramentas e contexto)

### 📋 **FASE 1 ANTIGA: Trilhas Inteligentes por Cargo/Departamento** (4-6h)

**Objetivo:** Personalizar trilhas baseado no cargo e departamento do colaborador.

#### **1.1. N8N Workflow - Trilhas Personalizadas** (3h)
- [ ] Nó: Buscar dados do colaborador (cargo + departamento)
- [ ] Nó: Buscar trilhas aplicáveis ao colaborador
- [ ] Nó: Verificar se colaborador tem acesso à trilha
- [ ] Atualizar mensagens do agente:
  - [ ] Listar trilhas disponíveis para o colaborador
  - [ ] Orientar sobre trilhas específicas do cargo/dept
  - [ ] Explicar por que certas trilhas são recomendadas

#### **1.2. Backend - Endpoints de Trilhas** (2h)
- [ ] GET `/api/trilhas/disponiveis/:colaboradorId` - Listar trilhas personalizadas
- [ ] POST `/api/trilhas/aplicar-filtros` - Aplicar filtros de cargo/dept
- [ ] GET `/api/trilhas/recomendacoes/:colaboradorId` - Trilhas recomendadas

#### **1.3. Testes** (1h)
- [ ] Testar com colaborador de diferentes departamentos
- [ ] Testar com colaborador de diferentes cargos
- [ ] Testar cenário sem departamento/cargo definido
- [ ] Validar que trilhas "para todos" aparecem sempre

#### **1.4. Documentação** (1h)
- [ ] Criar guia de uso para admins
- [ ] Atualizar README com nova feature
- [ ] Criar vídeo tutorial (opcional)

---

### 📊 **FASE 3 ANTIGA: Frontend - Anotações Avançadas** (3-4h)

**Objetivo:** Criar interface web para visualizar e gerenciar anotações inteligentes.

#### **3.1. Tela de Detalhes da Anotação** (2h)
- [ ] Exibir informações completas
- [ ] Histórico de anotações relacionadas
- [ ] Botão: "Gerar Melhoria a partir desta anotação"
- [ ] Link para melhoria gerada (se existir)

#### **3.2. Tela de Melhorias Sugeridas** (1.5h)
- [ ] Integrar com `onboarding_improvements` existente
- [ ] Exibir anotações que geraram a melhoria
- [ ] Botão: "Aprovar e Implementar"
- [ ] Botão: "Rejeitar"
- [ ] Campo: "Observações"

#### **3.3. Documentação e Exemplos** (0.5h)
- [ ] Exemplos de melhorias geradas
- [ ] Screenshots das novas telas
- [ ] Guia de uso para administradores

---

## 🧪 **TESTES E VALIDAÇÃO**

### **Integração** (4 tarefas)
- [ ] Testar fluxo completo: mensagem → sentimento → anotação → melhoria
- [ ] Testar com diferentes perfis de colaboradores
- [ ] Testar com diferentes tipos de trilhas
- [ ] Validar performance com grande volume de dados

### **Usabilidade** (4 tarefas)
- [ ] Testar com admins reais
- [ ] Testar com colaboradores reais
- [ ] Coletar feedback
- [ ] Ajustar UX conforme necessário

### **Performance** (4 tarefas)
- [ ] Benchmark de análise de sentimento
- [ ] Benchmark de busca de trilhas
- [ ] Benchmark de análise de padrões
- [ ] Otimizar queries lentas

### **Segurança** (4 tarefas)
- [ ] Validar RLS em todas as tabelas
- [ ] Testar injeção SQL
- [ ] Testar acesso não autorizado
- [ ] Validar sanitização de inputs

---

## 🚀 **PREPARAÇÃO PARA PRODUÇÃO**

### **Infraestrutura** (5 tarefas)
- [ ] Validar limites de API (OpenAI/Vertex)
- [ ] Configurar rate limiting
- [ ] Configurar monitoramento de erros
- [ ] Configurar logs estruturados
- [ ] Configurar alertas de performance

### **Dados** (3 tarefas)
- [ ] Backup antes de migrações
- [ ] Plano de rollback
- [ ] Script de migração de dados legados (se necessário)

### **Documentação** (4 tarefas)
- [ ] Atualizar documentação técnica
- [ ] Criar guia de troubleshooting
- [ ] Documentar decisões arquiteturais
- [ ] Changelog atualizado

### **Treinamento** (4 tarefas)
- [ ] Treinar equipe de suporte
- [ ] Criar materiais de treinamento para admins
- [ ] Criar FAQs
- [ ] Criar vídeos tutoriais

---

## 📱 **ROLLOUT**

### **Grupo Piloto** (6 tarefas)
- [ ] Selecionar 2-3 clientes beta
- [ ] Comunicar novidades
- [ ] Ativar features
- [ ] Monitorar métricas
- [ ] Coletar feedback
- [ ] Ajustar conforme necessário

### **Rollout Gradual** (3 tarefas)
- [ ] Ativar para 25% dos clientes
- [ ] Monitorar 3 dias
- [ ] Ativar para 50% dos clientes
- [ ] Monitorar 3 dias
- [ ] Ativar para 100% dos clientes

### **Comunicação** (3 tarefas)
- [ ] Email para clientes sobre novidades
- [ ] Post no blog/changelog
- [ ] Atualizar materiais de marketing
- [ ] Atualizar demos

---

## 📊 **MÉTRICAS E KPIs**

### **Técnicas** (4 tarefas)
- [ ] Número de sentimentos capturados
- [ ] Número de anotações criadas
- [ ] Taxa de erro da API de IA
- [ ] Performance de queries

### **Negócio** (4 tarefas)
- [ ] Distribuição de sentimentos
- [ ] Padrões identificados
- [ ] Melhorias sugeridas
- [ ] Taxa de conclusão de trilhas

### **Usuário** (4 tarefas)
- [ ] NPS dos colaboradores
- [ ] Tempo médio de onboarding
- [ ] Melhorias implementadas
- [ ] ROI das melhorias

---

## 🎨 **MELHORIAS OPCIONAIS - OPÇÃO A: UX/UI** (6-8h)

### **Modo Escuro** (1h)
- [ ] Adicionar toggle na sidebar
- [ ] Criar paleta de cores dark
- [ ] Atualizar todos os componentes
- [ ] Salvar preferência no localStorage
- [ ] Transição suave entre modos

### **Animações e Micro-interações** (2h)
- [ ] Animações de entrada para cards
- [ ] Loading states elegantes
- [ ] Skeleton screens
- [ ] Feedback visual em ações

### **Responsividade Mobile** (2h)
- [ ] Menu hamburguer em mobile
- [ ] Cards adaptáveis
- [ ] Tabelas responsivas
- [ ] Touch gestures

### **Funcionalidades Extras** (3h)
- [ ] Exportar lista de colaboradores (CSV/Excel)
- [ ] Exportar relatório de insights (PDF)
- [ ] Exportar estatísticas de trilhas
- [ ] Exportar histórico de sentimentos

### **Notificações e Alertas** (2h)
- [ ] Sistema de notificações in-app
- [ ] Notificações por email (sentimento negativo)
- [ ] Alertas de trilhas não concluídas
- [ ] Relatórios semanais automáticos

### **Dashboard Avançado** (3h)
- [ ] Gráficos interativos (Chart.js ou Recharts)
- [ ] Métricas em tempo real
- [ ] Comparação de períodos
- [ ] Insights preditivos com IA

---

## 📊 **FUNCIONALIDADES AVANÇADAS - OPÇÃO B** (8-12h)

### **Segurança Avançada** (3h)
- [ ] Autenticação de 2 fatores (2FA)
- [ ] Gestão de sessões
- [ ] Logs de auditoria
- [ ] Permissões granulares por página

### **Performance e Cache** (2h)
- [ ] Cache de dados (Redis ou similar)
- [ ] Paginação server-side
- [ ] Lazy loading de imagens
- [ ] Minificação de assets

### **Monitoramento e Analytics** (3h)
- [ ] Integração com Sentry (error tracking)
- [ ] Analytics (Google Analytics ou Plausible)
- [ ] Métricas de performance (Lighthouse)
- [ ] Alertas de downtime

---

## 📱 **MOBILE E PWA - OPÇÃO D** (12-20h)

### **Progressive Web App** (6h)
- [ ] Service Worker para cache offline
- [ ] Manifest.json configurado
- [ ] Instalação no dispositivo
- [ ] Push notifications

### **App Mobile Nativo** (12h)
- [ ] Setup React Native
- [ ] Recriar principais telas
- [ ] Autenticação mobile
- [ ] Build e publicação (App Store/Play Store)

---

## 🤖 **IA AVANÇADA - OPÇÃO E** (10-15h)

### **Predição e Recomendação** (4h)
- [ ] Prever colaboradores em risco de evasão
- [ ] Recomendar trilhas automaticamente
- [ ] Identificar gaps de conhecimento
- [ ] Score de engajamento

### **Chatbot Avançado** (3h)
- [ ] Integração com GPT-4 Turbo
- [ ] Respostas contextualizadas
- [ ] Memória de conversas
- [ ] Personalidade do agente

### **Analytics Preditivo** (3h)
- [ ] Cron job no N8N (semanal)
- [ ] Identificar padrões automaticamente
- [ ] Gerar relatórios executivos
- [ ] Sugestões de melhoria via IA

---

## 📚 **CONTEÚDO E GAMIFICAÇÃO - OPÇÃO F** (8-12h)

### **Novas Trilhas** (4h)
- [ ] Criar 10-15 novas trilhas
- [ ] Trilhas por departamento
- [ ] Trilhas por nível (júnior/pleno/sênior)
- [ ] Trilhas técnicas vs. soft skills

### **Conteúdo Multimídia** (3h)
- [ ] Upload de vídeos
- [ ] PDFs interativos
- [ ] Links externos
- [ ] Quiz e avaliações

### **Gamificação** (3h)
- [ ] Sistema de pontos
- [ ] Badges e conquistas
- [ ] Ranking de colaboradores
- [ ] Recompensas e desafios

---

## 🚀 **ROADMAP FUTURO - AGENTE PROATIVO E INTEGRAÇÕES**

### **Fase 4: Integrações Externas** (20-30h)

#### **4.1. Integração JIRA** (8-10h)
- [ ] Configurar OAuth 2.0 com JIRA
- [ ] Criar endpoints para criar/atualizar tickets
- [ ] Implementar webhooks JIRA → N8N
- [ ] Mapear campos: projeto, tipo, prioridade, descrição
- [ ] Testar criação automática de tickets
- [ ] Testar atualização de status
- [ ] Documentar configuração

#### **4.2. Integração Google Calendar** (6-8h)
- [ ] Configurar Google Calendar API
- [ ] Criar eventos automáticos (reuniões, lembretes)
- [ ] Implementar agendamento de 1:1s
- [ ] Sincronizar com trilhas (deadlines)
- [ ] Notificações de eventos próximos
- [ ] Testes de agendamento automático

#### **4.3. Integração Slack/Teams** (4-6h)
- [ ] Configurar Slack Bot
- [ ] Implementar comandos slash (/onboarding)
- [ ] Notificações de progresso
- [ ] Canal dedicado para onboarding
- [ ] Integração com Teams (opcional)

#### **4.4. Outras Integrações** (2-6h)
- [ ] GitHub/GitLab (para devs)
- [ ] SSO/Active Directory
- [ ] Ferramentas de produtividade (Notion, Confluence)

### **Fase 5: Agente Proativo Autônomo** (15-20h)

#### **5.1. Monitoramento Proativo** (6-8h)
- [ ] Cron jobs para análise contínua
- [ ] Detecção de padrões de comportamento
- [ ] Identificação de colaboradores em risco
- [ ] Alertas automáticos para gestores
- [ ] Dashboard de proatividade

#### **5.2. Decisão Autônoma** (6-8h)
- [ ] Lógica de decisão baseada em regras
- [ ] Aprendizado de padrões históricos
- [ ] Escalação automática de problemas
- [ ] Ações corretivas automáticas
- [ ] Logs de decisões tomadas

#### **5.3. Comunicação Proativa** (3-4h)
- [ ] Mensagens automáticas de acompanhamento
- [ ] Lembretes personalizados
- [ ] Parabéns por conquistas
- [ ] Ofertas de ajuda baseadas em contexto
- [ ] Relatórios automáticos para gestores

### **Fase 6: Analytics Avançado** (10-12h)

#### **6.1. Dashboard Executivo** (4-5h)
- [ ] Métricas de engajamento em tempo real
- [ ] Score de satisfação por departamento
- [ ] Previsão de turnover
- [ ] ROI do programa de onboarding
- [ ] Benchmarking entre empresas

#### **6.2. Inteligência Preditiva** (3-4h)
- [ ] Modelo de ML para prever sucesso
- [ ] Identificação precoce de problemas
- [ ] Recomendações personalizadas
- [ ] Otimização de trilhas por perfil

#### **6.3. Relatórios Automáticos** (3h)
- [ ] Relatórios semanais/mensais automáticos
- [ ] Insights gerados por IA
- [ ] Comparações históricas
- [ ] Alertas de tendências

### **Fase 7: Expansão e Escala** (variável)

#### **7.1. Multi-idioma** (8-10h)
- [ ] Suporte a inglês, espanhol
- [ ] Tradução automática de conteúdo
- [ ] Localização de métricas
- [ ] Suporte a diferentes fusos horários

#### **7.2. White-label** (12-15h)
- [ ] Personalização completa por cliente
- [ ] Temas customizáveis
- [ ] Logos e branding
- [ ] Configurações específicas por tenant

#### **7.3. Marketplace de Integrações** (20-30h)
- [ ] API pública para desenvolvedores
- [ ] Marketplace de plugins
- [ ] Integrações com +50 ferramentas
- [ ] Sistema de webhooks avançado

---

## 📋 **ÍNDICE DE DOCUMENTAÇÃO**

### **📚 Documentos Principais:**
- [`HISTORICO_IMPLEMENTACOES.md`](./HISTORICO_IMPLEMENTACOES.md) - Conquistas das Fases 1, 2 e 3
- [`FASE_4.5_APRIMORAMENTO_ANOTACOES.md`](./FASE_4.5_APRIMORAMENTO_ANOTACOES.md) - Planejamento detalhado da Fase 4.5
- [`N8N_WORKFLOW_v4.0.0_METADATA.md`](./N8N_WORKFLOW_v4.0.0_METADATA.md) - Documentação do workflow atual
- [`RESUMO_EXECUTIVO_FASE3.md`](./RESUMO_EXECUTIVO_FASE3.md) - Resumo executivo das implementações

### **🔧 Documentos Técnicos:**
- [`N8N_FASE1_SENTIMENT_ANALYSIS_IMPLEMENTACAO.md`](./N8N_FASE1_SENTIMENT_ANALYSIS_IMPLEMENTACAO.md) - Guia de implementação da Fase 1
- [`FLUXO_COMPLETO_DOCUMENTOS.md`](./FLUXO_COMPLETO_DOCUMENTOS.md) - Arquitetura de processamento de documentos
- [`N8N_WORKFLOW_README.md`](./N8N_WORKFLOW_README.md) - Guia de versionamento do workflow

### **🗄️ Migrações de Banco:**
- [`migrations/009_documents_metadata.sql`](./migrations/009_documents_metadata.sql) - Metadados de documentos
- [`migrations/010_conversation_history.sql`](./migrations/010_conversation_history.sql) - Histórico de conversas
- [`migrations/011_sentiment_provider.sql`](./migrations/011_sentiment_provider.sql) - Provider de sentimentos

---

## 🎯 **PRÓXIMOS PASSOS RECOMENDADOS**

### **🔥 PRIORIDADE 1 (AGORA): Evolution API** (8-10h)
```
✅ Solução imediata para testes em massa
✅ Zero custos para mensagens
✅ Mantém WhatsApp Business funcionando
✅ Documentação completa pronta
✅ Scripts automatizados criados

DIA 1 (3-4h): EVOLUTION.1 - Instalação e Configuração
DIA 2 (3-4h): EVOLUTION.2 - Integração com N8N
DIA 3 (1-2h): EVOLUTION.3 - Testes e Validação
```

### **⚡ PRIORIDADE 2 (DEPOIS): Fase 4.5** (6-8h)
```
✅ Sistema básico já funciona
✅ Vai de BÁSICO → INTELIGENTE
✅ Alto impacto imediato
✅ Documentação completa pronta

DIA 4 (3-4h): 4.5.1 - Categorização Inteligente
DIA 5 (2-3h): 4.5.2 - Detecção de Urgência
DIA 6 (3-4h): 4.5.3 - Análise de Padrões
DIA 7 (2-3h): 4.5.4 - Anotações Proativas
```

### **🚀 PRIORIDADE 3 (DEPOIS): Testes + Produção** (10-14h)
```
- Testes de integração completos
- Preparação para produção
- Monitoramento configurado
- Treinamento de equipe
```

### **📱 PRIORIDADE 3 (OPCIONAL): Melhorias UX** (6-8h)
```
- Responsividade mobile
- Modo escuro
- Dashboard avançado
```

### **🚀 FUTURO: Roadmap** (40-60h)
```
- Integrações externas (JIRA, Calendar, Slack)
- Agente proativo autônomo
- Analytics avançado
```

---

## 📈 **ESTATÍSTICAS ATUAIS**

```
Total de tarefas no checklist: ~790
Tarefas completas (Fases 1-3 + Brand Manual): 75 tarefas ✅
Tarefas pendentes: 715 tarefas 📋

Distribuição das pendentes:
- Evolution API (nova): 40 tarefas (8-10h)
- Fase 4.5 (próxima): 28 tarefas (6-8h)
- Testes + Produção: 38 tarefas (10-14h)
- Melhorias opcionais: ~200 tarefas (30-40h)
- Roadmap futuro: ~100 tarefas (40-60h)
```

---

*Última atualização: 17 de outubro de 2025*  
*Status: 3 Fases + Brand Manual Concluídas ✅ | Evolution API + Fase 4.5 Pendentes 🚧*