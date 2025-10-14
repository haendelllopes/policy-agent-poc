# 📋 N8N Workflow Navigator - Controle de Versões

## 📁 Arquivo Principal

**`N8N_WORKFLOW_NAVIGATOR_ATUAL.json`** - Workflow atualizado do N8N Navigator

---

## 🎯 Objetivo

Este arquivo serve como **referência versionada** do workflow N8N do projeto Navigator. 

A cada fase de implementação concluída, o workflow é atualizado aqui para:
- ✅ Manter histórico de mudanças
- ✅ Facilitar debugging
- ✅ Servir de base para futuras implementações
- ✅ Permitir rollback se necessário

---

## 🔄 Como Atualizar

### **Ao finalizar cada fase:**

1. **Exporte o workflow do N8N:**
   - Abra o workflow Navigator no N8N
   - Clique nos 3 pontinhos (...)
   - Selecione "Download" ou "Export"
   - Copie o JSON completo

2. **Atualize o arquivo:**
   - Substitua o conteúdo de `N8N_WORKFLOW_NAVIGATOR_ATUAL.json`
   - Cole o JSON exportado
   - Adicione nota no versionHistory

3. **Commit:**
   ```bash
   git add N8N_WORKFLOW_NAVIGATOR_ATUAL.json
   git commit -m "chore: Atualiza workflow N8N - Fase X completa"
   ```

---

## 📊 Histórico de Versões

### **v2.0.0 - 14/10/2025 - FASE 1 COMPLETA**
**Sentiment Analysis Nativo Implementado**

**Nós Adicionados:**
- ✅ `OpenAI Chat Model (Sentiment)` - gpt-4o-mini, temp=0
- ✅ `Sentiment Analysis` - LangChain Root Node
- ✅ `Process Sentiment Data` - Code Node para normalização

**Nós Modificados:**
- ✅ `1️⃣ Analisar Sentimento` → `💾 Save Sentiment to Backend`
- ✅ `3️⃣ É Negativo?` - Atualizada referência para Process Sentiment Data

**Fluxo Atual:**
```
BACKEND_URL → Sentiment Analysis → Process Sentiment Data → Save Sentiment to Backend → 3️⃣ É Negativo?
```

**Benefícios:**
- ⬇️ 50% latência (~1000ms → ~500ms)
- ⬇️ 85% custos (~$0.002 → ~$0.0003/mensagem)
- ⬆️ 3x mais dados (sentiment + confidence + factors)

---

### **v1.0.0 - 13/10/2025 - BASELINE**
**Workflow Inicial**

**Fluxo Original:**
```
BACKEND_URL → 1️⃣ Analisar Sentimento (HTTP Request) → 3️⃣ É Negativo?
```

---

## 📝 Notas Importantes

### **Diferenças entre versões:**

**v1.0.0 (Baseline):**
- HTTP Request direto para `/api/analise-sentimento`
- Backend faz análise com OpenAI/Gemini
- Latência: ~1000ms
- Custos: ~$0.002/mensagem

**v2.0.0 (Fase 1):**
- Sentiment Analysis nativo do N8N
- OpenAI gpt-4o-mini direto
- Latência: ~500ms
- Custos: ~$0.0003/mensagem

---

## 🚀 Próximas Fases Planejadas

### **Fase 2: Information Extractor** (Pendente)
- Substituir AI Agent de categorização
- Extrair 12+ campos estruturados
- JSON Schema validation

### **Fase 3: OpenAI Message a Model** (Pendente)
- Substituir AI Agent Gemini
- Histórico estruturado de conversas
- Function calling nativo OpenAI

---

## 🔗 Arquivos Relacionados

- `N8N_FASE1_SENTIMENT_ANALYSIS_IMPLEMENTACAO.md` - Guia de implementação Fase 1
- `N8N_SENTIMENT_ANALYSIS.md` - Documentação técnica Sentiment Analysis
- `N8N_INFORMATION_EXTRACTOR.md` - Documentação técnica Information Extractor
- `N8N_OPENAI_MESSAGE_MODEL.md` - Documentação técnica OpenAI Message a Model
- `N8N_APRIMORAMENTOS_AI_COMPLETO.md` - Visão geral de todos os aprimoramentos

---

**Última atualização:** 14 de outubro de 2025  
**Status:** ✅ Fase 1 completa | ⏳ Fase 2 pendente | ⏳ Fase 3 pendente


