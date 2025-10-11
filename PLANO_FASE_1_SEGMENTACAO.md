# 📋 PLANO DE IMPLEMENTAÇÃO - FASE 1
## Trilhas por Cargo e Departamento

**Data de Início:** 11 de outubro de 2025  
**Prazo Estimado:** 2 semanas  
**Status:** 🚀 INICIANDO

---

## 🎯 OBJETIVO

Permitir que admins **segmentem trilhas** por:
- 👔 **Cargo** (ex: "Trilha de Vendas" só para cargo "Vendedor")
- 🏢 **Departamento** (ex: "Trilha de TI" só para departamento "Tecnologia")
- 🎯 **Cargo + Departamento** (ex: "Gerente de Vendas" + "Comercial")
- 🌍 **Todos** (trilha geral para todos os colaboradores)

---

## ✅ O QUE JÁ TEMOS

### 🗄️ **Banco de Dados**
- ✅ Migração `006_trilhas_segmentacao.sql` **PRONTA**
- ✅ Colunas preparadas: `segmentacao_tipo`, `segmentacao_config`
- ✅ Tabela `trilha_segmentacao` definida
- ✅ Função `colaborador_tem_acesso_trilha()` criada
- ✅ View `trilhas_colaborador` preparada

### 📱 **Frontend**
- ✅ Página `admin-trilhas.html` existente
- ✅ Interface de criação de trilhas funcionando
- ✅ Tabelas de departamentos e cargos já populadas

### 🔧 **Backend**
- ✅ Rotas de trilhas existentes
- ✅ Rotas de departamentos funcionando
- ✅ Rotas de cargos funcionando
- ✅ Sistema de colaboradores com department_id e position_id

---

## 📝 O QUE FALTA IMPLEMENTAR

### 🗄️ **1. Banco de Dados** (30 min)

**Tarefa:** Executar migração 006

```bash
# Executar migração
node executar-migrations-supabase.js
```

**Validações:**
- [ ] Colunas `segmentacao_tipo` e `segmentacao_config` criadas em `trilhas`
- [ ] Tabela `trilha_segmentacao` criada
- [ ] Função `colaborador_tem_acesso_trilha()` funcionando
- [ ] View `trilhas_colaborador` disponível

---

### 🔧 **2. Backend - APIs** (4-6 horas)

Criar **6 novos endpoints**:

#### **GET /api/trilhas/:id/segmentacao**
Buscar configuração de segmentação de uma trilha

**Response:**
```json
{
  "trilha_id": "uuid",
  "segmentacao_tipo": "departamentos",
  "departamentos": [
    {"id": "uuid", "name": "Vendas"},
    {"id": "uuid", "name": "Marketing"}
  ],
  "cargos": []
}
```

#### **PUT /api/trilhas/:id/segmentacao**
Atualizar segmentação de uma trilha

**Body:**
```json
{
  "segmentacao_tipo": "departamentos|cargos|departamentos_cargos|todos",
  "department_ids": ["uuid1", "uuid2"],
  "position_ids": ["uuid1", "uuid2"]
}
```

#### **GET /api/trilhas/colaborador/:userId**
Trilhas disponíveis para um colaborador (considerando segmentação)

**Usa:** Função `colaborador_tem_acesso_trilha()`

#### **POST /api/trilhas/:id/segmentacao/departamentos**
Adicionar departamentos à trilha

#### **POST /api/trilhas/:id/segmentacao/cargos**
Adicionar cargos à trilha

#### **DELETE /api/trilhas/:id/segmentacao/:segId**
Remover segmentação específica

---

### 🎨 **3. Frontend - Admin** (6-8 horas)

**Modificar:** `public/admin-trilhas.html`

#### **Adicionar ao Formulário de Trilha:**

```html
<!-- Nova seção de Segmentação -->
<div class="form-section">
  <h3>🎯 Segmentação</h3>
  <p>Defina quem terá acesso a esta trilha</p>
  
  <!-- Radio buttons -->
  <div class="radio-group">
    <label>
      <input type="radio" name="segmentacao" value="todos" checked>
      🌍 Todos os Colaboradores
    </label>
    <label>
      <input type="radio" name="segmentacao" value="departamentos">
      🏢 Departamentos Específicos
    </label>
    <label>
      <input type="radio" name="segmentacao" value="cargos">
      👔 Cargos Específicos
    </label>
    <label>
      <input type="radio" name="segmentacao" value="departamentos_cargos">
      🎯 Departamento + Cargo
    </label>
  </div>
  
  <!-- Multi-select de Departamentos -->
  <div id="select-departamentos" style="display: none;">
    <label>Selecione os Departamentos:</label>
    <select multiple id="departamentos" class="multi-select">
      <!-- Carregado dinamicamente -->
    </select>
  </div>
  
  <!-- Multi-select de Cargos -->
  <div id="select-cargos" style="display: none;">
    <label>Selecione os Cargos:</label>
    <select multiple id="cargos" class="multi-select">
      <!-- Carregado dinamicamente -->
    </select>
  </div>
  
  <!-- Preview -->
  <div id="preview-acesso" style="display: none;">
    <h4>👥 Colaboradores que terão acesso:</h4>
    <div id="preview-list"></div>
  </div>
</div>
```

#### **JavaScript:**
- Carregar departamentos e cargos via API
- Mostrar/ocultar selects baseado no radio selecionado
- Preview de quantos colaboradores terão acesso
- Salvar segmentação junto com a trilha

---

### 🤖 **4. N8N Workflow** (2-3 horas)

**Modificar:** Workflow do agente de IA

#### **Adicionar Nós:**

1. **📥 Buscar Dados do Colaborador**
   ```
   Input: phone do WhatsApp
   Query: SELECT department_id, position_id FROM users WHERE phone = ?
   Output: { department_id, position_id }
   ```

2. **🔍 Buscar Trilhas Aplicáveis**
   ```
   Query: SELECT * FROM trilhas_colaborador 
          WHERE colaborador_id = ? AND tem_acesso = true
   ```

3. **💬 Mensagem Personalizada**
   ```
   Se cargo = "Vendedor":
     "Olá! Vi que você é Vendedor. Tenho 3 trilhas perfeitas para você:
      - Trilha de Vendas Consultivas
      - Técnicas de Negociação
      - CRM na Prática"
   ```

---

## 📅 CRONOGRAMA

### **Semana 1:**

#### **Dia 1-2** (8h)
- [x] ~~Fase 3 finalizada~~
- [ ] Executar migração 006
- [ ] Criar estrutura dos endpoints
- [ ] Implementar GET /api/trilhas/:id/segmentacao
- [ ] Implementar PUT /api/trilhas/:id/segmentacao

#### **Dia 3-4** (8h)
- [ ] Implementar GET /api/trilhas/colaborador/:userId
- [ ] Implementar POST .../segmentacao/departamentos
- [ ] Implementar POST .../segmentacao/cargos
- [ ] Implementar DELETE .../segmentacao/:segId
- [ ] Testar todos os endpoints

#### **Dia 5** (4h)
- [ ] Adicionar seção de segmentação no admin-trilhas.html
- [ ] Implementar radio buttons
- [ ] Carregar departamentos e cargos

### **Semana 2:**

#### **Dia 6-7** (8h)
- [ ] Implementar multi-select de departamentos
- [ ] Implementar multi-select de cargos
- [ ] Implementar preview de acesso
- [ ] Integrar com API de salvamento

#### **Dia 8-9** (8h)
- [ ] Atualizar workflow N8N
- [ ] Adicionar nós de roteamento
- [ ] Implementar mensagens personalizadas
- [ ] Testar fluxo completo no N8N

#### **Dia 10** (4h)
- [ ] Testes de integração completos
- [ ] Testes com diferentes perfis
- [ ] Correção de bugs
- [ ] Documentação

---

## 🧪 CASOS DE TESTE

### **Cenário 1: Trilha para Todos**
- Admin cria "Cultura da Empresa"
- Segmentação: "Todos"
- **Resultado:** Todos os colaboradores veem a trilha

### **Cenário 2: Trilha por Departamento**
- Admin cria "Processos de TI"
- Segmentação: "Departamentos" → "Tecnologia"
- **Resultado:** Só colaboradores de TI veem a trilha

### **Cenário 3: Trilha por Cargo**
- Admin cria "Vendas Consultivas"
- Segmentação: "Cargos" → "Vendedor"
- **Resultado:** Só vendedores veem a trilha

### **Cenário 4: Trilha Combinada**
- Admin cria "Gestão de Vendas"
- Segmentação: "Departamento + Cargo" → "Comercial" + "Gerente"
- **Resultado:** Só gerentes do comercial veem a trilha

---

## 🎯 BENEFÍCIOS

- 🎯 **Personalização Total** do onboarding
- ⚡ **Menos Ruído** - colaborador só vê trilhas relevantes
- 📈 **Maior Engajamento** - conteúdo direcionado
- 🎓 **Aprendizado Eficiente** - foco no que importa
- 📊 **Métricas Segmentadas** por cargo/departamento

---

## 📊 PROGRESSO ESPERADO

**Antes:**
```
Fase 1: PENDENTE (0%)
```

**Depois:**
```
Fase 1: COMPLETA (100%)
```

**Projeto Total:**
```
3 de 3 fases = 100% COMPLETO 🎉
```

---

## 🚀 VAMOS COMEÇAR?

Próximo passo: **Executar migração 006**

Quer que eu comece agora? 🎯

