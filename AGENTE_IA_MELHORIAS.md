# 🤖 Agente IA - Sistema de Melhorias do Onboarding

## 📋 Visão Geral

O **Agente IA de Melhorias** é um sistema inteligente que analisa automaticamente o processo de onboarding e identifica oportunidades de melhoria. Ele funciona através do **n8n** e armazena as sugestões no **Supabase**.

## 🏗️ Arquitetura

```
Flowly → Webhook → n8n → OpenAI → Análise → Supabase → Admin
```

### Componentes:

1. **📊 Tabela `onboarding_improvements`** (Supabase)
2. **🔗 API `/api/ai/improvements`** (Flowly)
3. **🤖 Workflow n8n** (Análise IA)
4. **📱 Notificações** (WhatsApp para admin)

## 🗄️ Estrutura da Tabela

### Campos Principais:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `categoria` | ENUM | conteudo, interface, fluxo, performance, engajamento, acessibilidade, outros |
| `prioridade` | ENUM | baixa, media, alta, critica |
| `titulo` | VARCHAR | Título descritivo da melhoria |
| `descricao` | TEXT | Descrição detalhada |
| `contexto` | JSONB | Dados específicos (trilha_id, colaborador_id, etc.) |
| `dados_analise` | JSONB | Dados que geraram a sugestão |
| `status` | ENUM | sugerida, em_analise, aprovada, em_desenvolvimento, implementada, rejeitada |
| `impacto_estimado` | ENUM | baixo, medio, alto, muito_alto |
| `esforco_estimado` | ENUM | baixo, medio, alto, muito_alto |

## 🚀 Como Configurar

### 1. Executar Migração

```sql
-- Execute o arquivo migrations/003_improvements_table.sql no Supabase
```

### 2. Configurar n8n

1. **Importar Workflow:**
   - Use o arquivo `n8n-ai-agent-workflow.json`
   - Configure as credenciais necessárias

2. **Configurar Credenciais:**
   - **OpenAI API:** Para análise inteligente
   - **Flowly API:** Para salvar melhorias
   - **WhatsApp API:** Para notificações

### 3. Variáveis de Ambiente

```env
# No Vercel (Flowly)
N8N_AI_WEBHOOK_URL=https://seu-usuario.app.n8n.cloud/webhook/ai-analysis
ADMIN_PHONE=+5511999999999

# No n8n
OPENAI_API_KEY=sk-...
FLOWLY_API_URL=https://flowly.vercel.app
WHATSAPP_API_URL=sua-api-whatsapp
```

## 🔄 Fluxo de Funcionamento

### 1. **Trigger Automático**
- Quando uma trilha é concluída
- Dados são enviados para o webhook `ai-analysis`

### 2. **Análise IA**
- n8n recebe os dados
- OpenAI analisa e sugere melhorias
- Processa a resposta em JSON estruturado

### 3. **Armazenamento**
- Melhorias são salvas no Supabase
- Status inicial: `sugerida`

### 4. **Notificação**
- Admin recebe WhatsApp com resumo
- Pode revisar no painel administrativo

## 📊 Exemplo de Dados Enviados

```json
{
  "event_type": "trilha_concluida",
  "colaborador_id": "uuid",
  "colaborador_nome": "João Silva",
  "trilha_id": "uuid",
  "trilha_nome": "Segurança da Informação",
  "nota_quiz": 85,
  "pontos_ganhos": 100,
  "admin_phone": "+5511999999999"
}
```

## 🤖 Exemplo de Melhoria Gerada

```json
{
  "categoria": "fluxo",
  "prioridade": "alta",
  "titulo": "Otimizar sequência de conteúdos da trilha de Segurança",
  "descricao": "Colaborador gastou 45min na trilha (média: 30min). Sugestão: reorganizar conteúdos por complexidade crescente, adicionar pré-requisitos visuais.",
  "contexto": {
    "trilha_id": "uuid",
    "momento": "pos_conclusao",
    "dados_especificos": {
      "tempo_total": 45,
      "nota_quiz": 85
    }
  },
  "impacto_estimado": "alto",
  "esforco_estimado": "medio"
}
```

## 🎯 Categorias de Melhorias

### 📚 **Conteúdo**
- Qualidade do material
- Clareza das instruções
- Exemplos práticos
- Atualizações necessárias

### 🎨 **Interface**
- UX/UI melhorias
- Navegação
- Responsividade
- Acessibilidade

### 🔄 **Fluxo**
- Sequência de conteúdos
- Transições entre etapas
- Tempo de conclusão
- Pontos de confusão

### ⚡ **Performance**
- Velocidade de carregamento
- Otimizações técnicas
- Recursos pesados
- Cache e CDN

### 🎯 **Engajamento**
- Gamificação
- Feedback visual
- Progresso
- Motivação

### ♿ **Acessibilidade**
- Leitores de tela
- Contraste
- Navegação por teclado
- Textos alternativos

## 📈 Monitoramento e Métricas

### Dashboard Admin (Futuro)
- Total de melhorias sugeridas
- Taxa de implementação
- Impacto por categoria
- ROI das melhorias

### Relatórios
- Melhorias por período
- Status de implementação
- Colaboração entre equipes

## 🔧 API Endpoints

### `POST /api/ai/improvements`
Registrar nova melhoria (usado pelo n8n)

### `GET /api/ai/improvements`
Listar melhorias (admin)

### `PUT /api/ai/improvements/:id/status`
Atualizar status (admin)

## 🚨 Alertas e Notificações

### WhatsApp Admin
```
🤖 *Agente IA - Nova Análise*

Otimizar sequência de conteúdos da trilha de Segurança

📊 *Categoria:* fluxo
🎯 *Prioridade:* alta
📈 *Impacto:* alto

Colaborador gastou 45min na trilha...

Ver detalhes no painel admin.
```

## 🎯 Próximos Passos

1. **✅ Implementado:**
   - Tabela no Supabase
   - API endpoints
   - Workflow n8n básico
   - Integração com webhooks

2. **🔄 Em Desenvolvimento:**
   - Dashboard administrativo
   - Métricas e relatórios
   - Workflow de aprovação

3. **🚀 Futuro:**
   - IA mais avançada
   - Integração com outros sistemas
   - Automação de implementação

## 🐛 Troubleshooting

### Problema: Melhorias não sendo geradas
- Verificar webhook n8n
- Conferir credenciais OpenAI
- Ver logs do Vercel

### Problema: Notificações não chegam
- Verificar ADMIN_PHONE
- Testar API WhatsApp
- Conferir workflow n8n

### Problema: Dados não salvam
- Verificar conexão Supabase
- Conferir RLS policies
- Ver logs de erro

---

**🎉 Sistema pronto para identificar e implementar melhorias contínuas no processo de onboarding!**



