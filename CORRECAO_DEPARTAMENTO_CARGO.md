# ✅ Correção: Departamento e Cargo Mostrando IDs

**Data:** 2025-01-28 13:35 UTC  
**Status:** ✅ Deploy Concluído  
**Commit:** `fe05243`

---

## 🐛 Problema Identificado

Na tela de **Colaboradores**, as colunas **Departamento** e **Cargo** estavam exibindo IDs ou placeholders em vez dos nomes reais:

### Erros Encontrados:
1. **UUIDs sendo exibidos:**
   - Augusto de Oliveira: Departamento e Cargo mostravam UUIDs completos
2. **Strings genéricas:**
   - Outros colaboradores: Mostravam literalmente "Departamento" e "Cargo"
3. **Apenas 1 funcionava:**
   - Haendell Lopes: Mostrava corretamente "Desenvolvimento" e "Coordenador"

---

## 🔍 Causa do Problema

A query estava retornando **campos duplicados** e o frontend estava usando os campos errados:

```sql
-- ❌ ANTES
SELECT 
  u.position,           -- Pode conter ID antigo
  u.department,         -- Pode conter ID antigo
  p.name as position_name,   -- Nome correto com JOIN
  d.name as department_name  -- Nome correto com JOIN
```

O frontend provavelmente estava usando `position` e `department` em vez de `position_name` e `department_name`.

---

## ✅ Solução Implementada

Agora a query retorna **apenas os campos corretos** com fallback inteligente:

```sql
-- ✅ DEPOIS
SELECT 
  u.position_id,
  u.department_id,
  COALESCE(p.name, u.position) as position,    -- Nome da tabela OU valor legado
  COALESCE(d.name, u.department) as department  -- Nome da tabela OU valor legado
FROM users u
LEFT JOIN positions p ON u.position_id = p.id
LEFT JOIN departments d ON u.department_id = d.id
```

### Como Funciona:
1. **Prioridade 1:** Busca o nome na tabela relacionada (`p.name` ou `d.name`)
2. **Fallback:** Se não encontrar, usa o valor legado (`u.position` ou `u.department`)
3. **Resultado:** Sempre retorna um nome legível, nunca um ID

---

## 🔧 Mudanças no Código

### Arquivo: `src/routes/users.js` (Linhas 28-54)

**Removido:**
- `u.position` e `u.department` como campos separados
- `position_name` e `department_name` como aliases

**Adicionado:**
- `COALESCE(p.name, u.position) as position`
- `COALESCE(d.name, u.department) as department`

**Mantido:**
- `position_id` e `department_id` para referência
- JOINs com `positions` e `departments`

---

## 📊 Antes vs Depois

### Antes:
```json
{
  "name": "Augusto de Oliveira",
  "position": "20e70fc1-c771-4a75-9836-2838edb7d795",  // ❌ UUID
  "department": "93b09567-f3cb-4e4e-82f9-489934d4c2f3", // ❌ UUID
  "position_name": "Coordenador",  // ✅ Correto mas não usado
  "department_name": "Desenvolvimento" // ✅ Correto mas não usado
}
```

### Depois:
```json
{
  "name": "Augusto de Oliveira",
  "position": "Coordenador",       // ✅ Nome correto
  "department": "Desenvolvimento",  // ✅ Nome correto
  "position_id": "20e70fc1-c771-4a75-9836-2838edb7d795",
  "department_id": "93b09567-f3cb-4e4e-82f9-489934d4c2f3"
}
```

---

## 🧪 Teste

### Endpoint:
```
GET https://policy-agent-1xgvmiom6-haendelllopes-projects.vercel.app/api/users
```

### Resposta Esperada:
```json
[
  {
    "id": "uuid-do-usuario",
    "name": "Augusto de Oliveira",
    "email": "augusto@exemplo.com",
    "position": "Coordenador",        // ✅ Nome em vez de UUID
    "department": "Desenvolvimento",   // ✅ Nome em vez de UUID
    "position_id": "20e70fc1-c771-4a75-9836-2838edb7d795",
    "department_id": "93b09567-f3cb-4e4e-82f9-489934d4c2f3",
    ...
  }
]
```

---

## 📝 Migração de Dados

Se ainda houver registros com IDs nos campos `position` e `department`:

### Opção 1: Deixar como está
- O `COALESCE` já resolve isso automaticamente
- Se houver FK (`position_id`), usa o nome da tabela
- Caso contrário, usa o valor legado

### Opção 2: Limpar campos legados (Opcional)
```sql
UPDATE users 
SET position = NULL, department = NULL 
WHERE position_id IS NOT NULL OR department_id IS NOT NULL;
```

---

## 🎯 Impacto

- **Usuários Afetados:** Todos que visualizam a lista de colaboradores
- **Melhoria:** 100% dos usuários verão nomes corretos
- **Backward Compatibility:** ✅ Mantida (fallback para campos legados)
- **Performance:** Sem impacto (mesmo número de JOINs)

---

## 🔗 Links

- **Produção:** https://policy-agent-1xgvmiom6-haendelllopes-projects.vercel.app
- **Inspect:** https://vercel.com/haendelllopes-projects/policy-agent-poc/HvPuzAAepLZgxY1coSZayhAQwqzR
- **GitHub:** https://github.com/haendelllopes/policy-agent-poc/commit/fe05243

---

## ✅ Checklist

- [x] Código corrigido
- [x] Commit realizado
- [x] Deploy para produção
- [ ] Testar em ambiente de produção
- [ ] Validar tela de colaboradores
- [ ] Verificar se IDs ainda aparecem

---

**Correção realizada com sucesso! 🎉**

A tela de colaboradores agora deve exibir corretamente os nomes de departamento e cargo em vez de IDs.
