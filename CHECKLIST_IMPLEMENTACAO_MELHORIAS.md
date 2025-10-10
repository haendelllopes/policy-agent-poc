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

## 📋 Fase 2: Análise de Sentimento (Semanas 3-4)

### 🗄️ Banco de Dados
- [ ] Executar migração `005_colaborador_sentimentos.sql`
- [ ] Validar criação da tabela `colaborador_sentimentos`
- [ ] Validar colunas adicionadas em `users`:
  - [ ] `sentimento_atual`
  - [ ] `sentimento_atualizado_em`
- [ ] Testar trigger `trigger_atualizar_sentimento_usuario`
- [ ] Verificar índices criados
- [ ] Validar políticas RLS

### 🤖 Integração de IA

#### OpenAI / Vertex AI
- [ ] Configurar credenciais da API
- [ ] Criar prompt para análise de sentimento
- [ ] Testar análise com mensagens de exemplo
- [ ] Ajustar prompt para melhor precisão
- [ ] Implementar fallback em caso de erro

#### Prompt de Análise de Sentimento
```
Exemplo de prompt a criar:
"Analise o sentimento da seguinte mensagem de um colaborador em processo de onboarding.
Classifique como: muito_positivo, positivo, neutro, negativo, muito_negativo.
Forneça intensidade de 0.00 a 1.00.
Identifique palavras-chave, tom e emojis.

Mensagem: {mensagem}

Retorne em JSON:
{
  "sentimento": "...",
  "intensidade": 0.XX,
  "fatores_detectados": {
    "palavras_chave": [],
    "tom": "...",
    "emojis": []
  }
}"
```

- [ ] Criar e testar prompt
- [ ] Validar precisão da análise
- [ ] Ajustar conforme necessário

### 🔧 Backend (API)

#### Endpoints - Sentimentos
- [ ] **POST** `/api/sentimentos` - Registrar sentimento
- [ ] **GET** `/api/sentimentos/colaborador/:userId` - Histórico de sentimentos
- [ ] **GET** `/api/sentimentos/colaborador/:userId/atual` - Sentimento atual
- [ ] **GET** `/api/sentimentos/estatisticas/:tenantId` - Estatísticas agregadas
- [ ] **GET** `/api/sentimentos/trilha/:trilhaId` - Sentimentos por trilha
- [ ] **GET** `/api/sentimentos/alertas/:tenantId` - Colaboradores com sentimento negativo

#### Validações
- [ ] Validar formato de sentimento
- [ ] Validar intensidade (0.00 - 1.00)
- [ ] Validar origem do sentimento
- [ ] Validar permissões

#### Testes
- [ ] Testar registro de sentimento
- [ ] Testar atualização automática em `users`
- [ ] Testar busca de histórico
- [ ] Testar estatísticas agregadas

### 🤖 N8N Workflow

#### Nós de Análise
- [ ] Nó: Receber mensagem do colaborador
- [ ] Nó: Chamar API de análise de sentimento (OpenAI/Vertex)
- [ ] Nó: Parsear resposta da IA
- [ ] Nó: Salvar sentimento no banco de dados
- [ ] Nó: Buscar sentimento atual do colaborador
- [ ] Nó: Decidir tom da resposta baseado no sentimento
- [ ] Nó: Gerar resposta adaptada

#### Lógica de Adaptação de Tom
- [ ] **Muito Negativo** → Tom empático, oferecer ajuda imediata
- [ ] **Negativo** → Tom compreensivo, dar suporte
- [ ] **Neutro** → Tom profissional padrão
- [ ] **Positivo** → Tom motivador, dar reconhecimento
- [ ] **Muito Positivo** → Tom celebrativo, parabenizar

#### Exemplos de Respostas por Sentimento
```
Criar biblioteca de templates:

MUITO_NEGATIVO:
- "Entendo que está difícil. Vamos resolver isso juntos! 💙"
- "Percebo sua frustração. Como posso te ajudar agora?"

NEGATIVO:
- "Vejo que você está com dificuldades. Posso te dar umas dicas?"
- "Sei que pode ser desafiador. Que tal tentarmos de outra forma?"

NEUTRO:
- "Entendido. Vamos continuar?"
- "Certo! Próximo passo..."

POSITIVO:
- "Muito bem! Você está indo ótimo!"
- "Que legal! Continue assim! 👏"

MUITO_POSITIVO:
- "Incrível! Estou muito feliz com seu progresso! 🎉"
- "Sensacional! Você é demais! 🌟"
```

- [ ] Criar templates de respostas
- [ ] Implementar lógica de seleção
- [ ] Testar com diferentes sentimentos

#### Alertas
- [ ] Criar alerta para sentimento muito_negativo
- [ ] Enviar notificação para gestor/RH
- [ ] Criar task para acompanhamento

### 🎨 Frontend (Admin)

#### Dashboard de Sentimentos
- [ ] Card: Sentimento médio dos colaboradores
- [ ] Gráfico: Evolução de sentimentos ao longo do tempo
- [ ] Gráfico: Distribuição de sentimentos
- [ ] Lista: Colaboradores com sentimento negativo (alertas)
- [ ] Filtros: Por departamento, cargo, trilha
- [ ] Detalhe: Histórico de sentimentos por colaborador

#### Detalhes do Colaborador
- [ ] Adicionar seção "Sentimento Atual" no perfil
- [ ] Gráfico de evolução emocional
- [ ] Histórico de interações e sentimentos

### 📚 Documentação
- [ ] Documentar API de sentimentos
- [ ] Documentar lógica de adaptação de tom
- [ ] Guia para interpretar sentimentos
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

#### Prompt para Geração de Melhorias
```
Exemplo de prompt:
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
- [ ] Validar qualidade das sugestões
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

### Funcionalidade
- ✅ Todas as features implementadas e funcionando
- ✅ Sem bugs críticos
- ✅ Performance dentro do esperado
- ✅ Testes passando (>90% cobertura)

### Negócio
- ✅ NPS dos colaboradores ≥ 8.0
- ✅ Taxa de conclusão de trilhas ≥ 80%
- ✅ Tempo médio de onboarding ≤ 12 dias
- ✅ Melhorias implementadas ≥ 3/mês

### Técnico
- ✅ Documentação completa
- ✅ Código revisado
- ✅ Sem dívidas técnicas críticas
- ✅ Equipe treinada

---

**Última atualização:** 10 de outubro de 2025  
**Responsável:** Haendell Lopes

