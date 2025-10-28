# 🔧 Como Corrigir Cargo do Colaborador

## ❌ **Problema**

Frontend mostra que colaborador tem cargo "Desenvolvedor"  
Banco de dados: `position_id = NULL`

---

## ✅ **Solução em 3 Passos**

### **Passo 1: Identificar ID do Cargo**

Execute no Supabase SQL Editor:

```sql
SELECT id, name FROM positions WHERE name ILIKE '%esenvolvedor%';
```

Copie o **ID** retornado (exemplo: `123e4567-e89b-12d3-a456-426614174000`)

### **Passo 2: Atualizar Colaborador**

Substitua `ID_AQUI` pelo ID do Passo 1:

```sql
UPDATE users 
SET position_id = 'ID_AQUI',
    updated_at = NOW()
WHERE id = 'b2b1f3da-0ea0-445e-ba7f-0cd95e663900';
```

### **Passo 3: Verificar**

```sql
SELECT 
  name, 
  position_id,
  (SELECT name FROM positions WHERE id = users.position_id) as cargo
FROM users 
WHERE id = 'b2b1f3da-0ea0-445e-ba7f-0cd95e663900';
```

Deve mostrar o cargo "Desenvolvedor" ✅

---

## 🎯 **Depois Disso**

1. Recarregue `colaborador-trilhas`
2. As trilhas do cargo "Desenvolvedor" devem aparecer
3. Chat flutuante também vai funcionar

---

**Tempo:** 2 minutos  
**Dificuldade:** ⭐ Fácil

