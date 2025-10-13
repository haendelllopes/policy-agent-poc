# 🤖 Sistema Conversacional para Trilhas

## 🎯 **Visão Geral**

Sistema que permite aos colaboradores interagir naturalmente com o agente Flowly para gerenciar suas trilhas de onboarding através de conversas.

---

## 🔄 **Fluxo Conversacional**

### **1️⃣ Consulta de Trilhas Disponíveis**
```
Colaborador: "Tenho alguma trilha disponível?"
           ↓
Agente: "Você tem 3 trilhas disponíveis:
        📚 Segurança da Informação (7 dias)
        🎯 Processos Internos (5 dias)  
        💼 Políticas da Empresa (10 dias)
        
        Qual você gostaria de começar?
        Link: [Dashboard do Colaborador]"
```

### **2️⃣ Início de Trilha**
```
Colaborador: "Quero começar a trilha de Segurança"
           ↓
Agente: "Perfeito! Iniciando trilha 'Segurança da Informação'...
        ✅ Trilha iniciada com sucesso!
        
        📄 Primeiro conteúdo: Política de Senhas
        🔗 Acesse: [Link do Documento]
        
        Prazo: 7 dias (até 18/10/2025)
        Status: Em andamento"
```

### **3️⃣ Feedback sobre Trilha**
```
Colaborador: "Finalizei a trilha de Segurança"
           ↓
Agente: "🎉 Parabéns! Trilha 'Segurança da Informação' concluída!
        Pontuação: 85%
        
        Próxima trilha sugerida: Processos Internos
        Quer começar?"
```

```
Colaborador: "Tive dificuldade com a política de senhas"
           ↓
Agente: "Entendo sua dificuldade com a política de senhas.
        Vou encaminhar seu feedback para a equipe de RH.
        
        Posso te ajudar com alguma dúvida específica?"
```

---

## 🔧 **Endpoints da API**

### **GET /api/agent/trilhas/disponiveis/:colaboradorId**
**Descrição:** Lista trilhas disponíveis para um colaborador

**Parâmetros:**
- `colaboradorId` (path): ID do colaborador
- `tenant` (query): Subdomínio do tenant

**Resposta:**
```json
{
  "disponiveis": [
    {
      "id": "uuid",
      "nome": "Segurança da Informação",
      "descricao": "Políticas de segurança...",
      "prazo_dias": 7,
      "ordem": 1,
      "situacao": "disponivel"
    }
  ],
  "em_andamento": [
    {
      "id": "uuid",
      "nome": "Processos Internos",
      "status": "em_andamento",
      "data_limite": "2025-10-18T..."
    }
  ],
  "concluidas": [
    {
      "id": "uuid",
      "nome": "Políticas da Empresa",
      "status": "concluida"
    }
  ],
  "dashboard_url": "https://navigator.com/colaborador-dashboard.html?colaborador_id=uuid&tenant=demo"
}
```

### **POST /api/agent/trilhas/iniciar**
**Descrição:** Inicia uma trilha via agente

**Body:**
```json
{
  "colaborador_id": "uuid",
  "trilha_id": "uuid"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Trilha 'Segurança da Informação' iniciada com sucesso!",
  "trilha": {
    "id": "uuid",
    "nome": "Segurança da Informação",
    "descricao": "Políticas de segurança...",
    "prazo_dias": 7
  },
  "progresso_id": "uuid",
  "primeiro_conteudo": {
    "id": "uuid",
    "tipo": "documento",
    "titulo": "Política de Senhas",
    "descricao": "Documento sobre política...",
    "url": "https://example.com/doc.pdf",
    "ordem": 1
  },
  "dashboard_url": "https://navigator.com/colaborador-dashboard.html?colaborador_id=uuid&tenant=demo"
}
```

### **POST /api/agent/trilhas/feedback**
**Descrição:** Recebe feedback sobre uma trilha

**Body:**
```json
{
  "colaborador_id": "uuid",
  "trilha_id": "uuid",
  "feedback": "Tive dificuldade com a política de senhas",
  "tipo_feedback": "dificuldade"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Feedback recebido com sucesso! Obrigado pelo seu retorno.",
  "feedback": {
    "colaborador_nome": "João Silva",
    "trilha_nome": "Segurança da Informação",
    "feedback": "Tive dificuldade com a política de senhas",
    "tipo_feedback": "dificuldade"
  }
}
```

---

## 🤖 **Integração com N8N**

### **Webhooks Enviados:**

1. **Trilha Iniciada:**
```json
{
  "type": "trilha",
  "tipo": "trilha_iniciada",
  "colaborador_id": "uuid",
  "colaborador_nome": "João Silva",
  "colaborador_email": "joao@demo.com",
  "colaborador_phone": "5511999999999",
  "trilha_id": "uuid",
  "trilha_nome": "Segurança da Informação",
  "prazo_dias": 7,
  "data_limite": "2025-10-18T..."
}
```

2. **Feedback de Trilha:**
```json
{
  "type": "trilha",
  "tipo": "feedback_trilha",
  "colaborador_id": "uuid",
  "colaborador_nome": "João Silva",
  "colaborador_email": "joao@demo.com",
  "colaborador_phone": "5511999999999",
  "trilha_id": "uuid",
  "trilha_nome": "Segurança da Informação",
  "feedback": "Tive dificuldade com a política de senhas",
  "tipo_feedback": "dificuldade"
}
```

---

## 📊 **Tipos de Feedback**

| **Tipo** | **Descrição** | **Uso** |
|----------|---------------|---------|
| `geral` | Feedback geral sobre a trilha | Comentários gerais |
| `dificuldade` | Relato de dificuldades | Problemas específicos |
| `sugestao` | Sugestões de melhoria | Ideias para aprimorar |
| `elogio` | Elogios e reconhecimento | Feedback positivo |

---

## 🧪 **Testes**

### **1️⃣ Teste de Trilhas Disponíveis:**
```bash
curl -X GET "https://navigator-gules.vercel.app/api/agent/trilhas/disponiveis/4ab6c765-bcfc-4280-84cd-3190fcf881c2?tenant=demo"
```

### **2️⃣ Teste de Início de Trilha:**
```bash
curl -X POST "https://navigator-gules.vercel.app/api/agent/trilhas/iniciar?tenant=demo" \
  -H "Content-Type: application/json" \
  -d '{
    "colaborador_id": "4ab6c765-bcfc-4280-84cd-3190fcf881c2",
    "trilha_id": "uuid-da-trilha"
  }'
```

### **3️⃣ Teste de Feedback:**
```bash
curl -X POST "https://navigator-gules.vercel.app/api/agent/trilhas/feedback?tenant=demo" \
  -H "Content-Type: application/json" \
  -d '{
    "colaborador_id": "4ab6c765-bcfc-4280-84cd-3190fcf881c2",
    "trilha_id": "uuid-da-trilha",
    "feedback": "Tive dificuldade com a política de senhas",
    "tipo_feedback": "dificuldade"
  }'
```

---

## 🎯 **Vantagens do Sistema Conversacional**

### **✅ Benefícios:**
- **Interface Natural:** Conversas em linguagem natural
- **Acessibilidade:** Funciona em qualquer canal (WhatsApp, Telegram, Slack)
- **Flexibilidade:** Colaborador escolhe quando e como interagir
- **Feedback Contínuo:** Recebe suporte durante toda a trilha
- **Integração Completa:** Webhooks mantêm RH informado

### **🔄 Fluxo Unificado:**
```
Colaborador ←→ Agente ←→ Sistema ←→ N8N ←→ RH/Admin
```

---

## 📈 **Próximos Passos**

### **1️⃣ Implementação no N8N:**
- Configurar nós para processar feedback
- Criar respostas automáticas personalizadas
- Integrar com sistema de notificações

### **2️⃣ Melhorias Futuras:**
- Análise de sentimento em feedbacks
- Recomendações personalizadas de trilhas
- Gamificação baseada em conversas
- Relatórios de engajamento conversacional

### **3️⃣ Dashboard de Feedback:**
- Visualização de feedbacks por trilha
- Métricas de satisfação
- Identificação de pontos de melhoria

---

## 🚀 **Status Atual**

```
✅ API Endpoints: 3/3 implementados
✅ Webhooks: Integrados com N8N
✅ Banco de Dados: Tabela trilha_feedbacks criada
✅ Testes: Curl commands prontos
⏳ N8N Integration: Aguardando configuração
⏳ Frontend: Dashboard colaborador pendente

Sistema: 80% Completo
```

---

**🎊 Sistema conversacional pronto para uso! Agora os colaboradores podem interagir naturalmente com o Flowly para gerenciar suas trilhas!**


