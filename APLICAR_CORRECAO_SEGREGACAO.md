# 🔧 Como Aplicar a Correção da Segregação

## 📋 **Problema**

A segregação está com lógica errada:
- Atualmente: `departamentos_cargos` sempre exige AMBOS (AND)
- Deveria: Verificar o que está **marcado na criação da trilha**

## ✅ **Correção**

Nova lógica:
- **Se marcou apenas Cargo** → verifica cargo
- **Se marcou apenas Departamento** → verifica departamento
- **Se marcou Cargo E Departamento** → exige AMBOS (AND)

---

## 🚀 **Como Aplicar**

### **Opção 1: Via Supabase Dashboard**

1. Acesse: https://supabase.com/dashboard
2. Vá em **SQL Editor**
3. Execute o arquivo: `migrations/020_fix_segregacao_or_and.sql`

### **Opção 2: Via Código**

```bash
# No projeto
cd policy-agent-poc
psql $DATABASE_URL -f migrations/020_fix_segregacao_or_and.sql
```

### **Opção 3: Via Migração**

Adicionar ao arquivo de migrações e executar automaticamente.

---

## 🧪 **Como Testar**

1. **Crie uma trilha marcando APENAS departamento:**
   ```sql
   INSERT INTO trilha_segmentacao (trilha_id, department_id, position_id, incluir)
   VALUES ('trilha-id', 'department-id', NULL, true);
   ```
   
2. **Teste acesso:**
   - Colaborador com o departamento → ✅ Deve ter acesso
   - Colaborador sem o departamento → ❌ Sem acesso

3. **Crie uma trilha marcando Cargo E Departamento:**
   ```sql
   INSERT INTO trilha_segmentacao (trilha_id, department_id, position_id, incluir)
   VALUES ('trilha-id', 'department-id', 'position-id', true);
   ```
   
4. **Teste acesso:**
   - Colaborador com departamento → ❌ Sem acesso (falta cargo)
   - Colaborador com cargo → ❌ Sem acesso (falta departamento)
   - Colaborador com AMBOS → ✅ Tem acesso

---

**Status:** ✅ SQL criado  
**Próximo passo:** Aplicar migração no banco

