# 🚀 Como Aplicar a Migração de Segregação

## 📋 **Status Atual**

- ✅ **Código Node.js:** Todos os endpoints usam `colaborador_tem_acesso_trilha()`
- ⚠️ **Função SQL no banco:** Precisa ser atualizada com a nova lógica

---

## 🎯 **Onde a Segregação Está Aplicada**

Todos estes lugares usam a **MESMA função SQL**:

1. ✅ **Tela colaborador-trilhas** → `/api/colaborador/trilhas`
2. ✅ **Chat flutuante** → `/api/agent-n8n/trilhas/disponiveis`
3. ✅ **Agente N8N** → `/api/agent/trilhas/disponiveis`
4. ✅ **Outras rotas** → `/api/trilhas-segmentacao`

**Todos chamam:** `colaborador_tem_acesso_trilha(colaborador_id, trilha_id)`

---

## 🔧 **O Que Precisa Ser Feito**

A função SQL no banco precisa ser atualizada. A nova lógica:

```sql
-- Se marcou AMBOS (cargo + departamento juntos) → exige AMBOS (AND)
-- Se marcou apenas 1 → verifica apenas esse
```

---

## 📝 **Como Aplicar**

### **Opção 1: Via Supabase Dashboard** (Mais Fácil)

1. Acesse: https://supabase.com/dashboard
2. Vá em **SQL Editor**
3. Selecione seu projeto
4. Abra o arquivo: `migrations/020_fix_segregacao_or_and.sql`
5. Copie TODO o conteúdo
6. Cole no SQL Editor
7. Clique em **Run**
8. Aguarde execução completa

### **Opção 2: Via Terminal** (Se tiver acesso direto)

```bash
# Conectar ao banco Supabase
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres" \
  -f migrations/020_fix_segregacao_or_and.sql
```

---

## ⚠️ **IMPORTANTE**

Esta migração **não afeta dados existentes**, apenas atualiza a **lógica de verificação**.

**O que a migração faz:**
- ✅ Atualiza a função `colaborador_tem_acesso_trilha()`
- ✅ Adiciona lógica OR/AND correta
- ✅ Não deleta dados
- ✅ Não afeta trilhas existentes

**O que ela NÃO faz:**
- ❌ Não cria/deleta tabelas
- ❌ Não modifica dados existentes
- ❌ Não quebra nada

---

## 🧪 **Como Validar Após Aplicar**

### **Teste 1: Trilha Apenas com Departamento**

```sql
-- Ver trilhas disponíveis para um colaborador
SELECT nome FROM trilhas t
WHERE colaborador_tem_acesso_trilha(
  'ID_COLABORADOR', 
  t.id
) = true;
```

### **Teste 2: Trilha com Cargo E Departamento**

```sql
-- Deve mostrar apenas se colaborador tem AMBOS
SELECT nome FROM trilhas t
WHERE colaborador_tem_acesso_trilha(
  'ID_COLABORADOR_COM_AMBOS', 
  t.id
) = true;
```

---

## 📊 **Exemplo Prático**

### **Antes da Correção:**
- Trilha "Onboarding Dev" marcada com **Tecnologia + Desenvolvedor**
- Colaborador de Marketing → ❌ **Não vê** (correto!)
- Colaborador de Tecnologia (mas não é dev) → ❌ **Não vê** (correto!)
- Colaborador de Tecnologia E é Dev → ✅ **Vê** (correto!)

### **Depois da Correção:**
- ✅ **Mesmo comportamento**
- ✅ Lógica agora reflete o que foi marcado

---

**Próximo passo:** Aplicar a migração SQL no Supabase  
**Arquivo:** `migrations/020_fix_segregacao_or_and.sql`  
**Status:** ⏳ Aguardando aplicação

