# 👥 Adicionar 15 Usuários ao Navigator

## 📋 Resumo

Este guia explica como adicionar 15 novos usuários ao sistema Navigator com os seguintes requisitos:
- Gestor: Haendell Lopes (sempre)
- Buddy: Vanessa (sempre)
- Variedade de departamentos e cargos
- Dados realistas para testes

---

## 🎯 Pré-requisitos

1. **Usuários de referência existentes:**
   - ✅ Haendell Lopes (gestor)
   - ✅ Vanessa (buddy)

2. **Banco de dados acessível:**
   - ✅ Supabase configurado
   - ✅ Variável `DATABASE_URL` no `.env`

---

## 🚀 Como Executar

### Opção 1: Script Node.js (Recomendado)

```bash
cd policy-agent-poc
node adicionar-15-usuarios-v2.js
```

Este script:
1. Busca os IDs do Haendell e da Vanessa
2. Cria/verifica departamentos e cargos
3. Insere 15 novos usuários
4. Mostra um resumo dos usuários inseridos

### Opção 2: Via SQL Editor do Supabase

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Abra o arquivo `adicionar-15-usuarios.sql`
4. Copie e cole o conteúdo
5. Clique em **RUN**

---

## 👥 Usuários que serão criados

1. **Ana Paula Santos** - Desenvolvedor Júnior
2. **Bruno Oliveira** - Desenvolvedor Pleno
3. **Camila Ferreira** - Designer Júnior
4. **Diego Almeida** - Desenvolvedor Sênior
5. **Fernanda Costa** - Analista de Marketing
6. **Gabriel Lima** - QA Pleno
7. **Isabella Martins** - Desenvolvedor Pleno
8. **João Henrique** - Designer Pleno
9. **Karina Silva** - Analista de RH
10. **Lucas Pereira** - Vendedor
11. **Mariana Rocha** - Desenvolvedor Júnior
12. **Natália Souza** - Tech Lead
13. **Otávio Rodrigues** - QA Júnior
14. **Patrícia Alves** - Especialista de Marketing
15. **Ricardo Barbosa** - Vendedor Sênior

---

## 📊 Departamentos Criados

- Desenvolvimento
- Design
- Recursos Humanos
- Comercial
- Marketing
- Financeiro
- Operações
- Quality Assurance

---

## 💼 Cargos Criados

### Desenvolvimento
- Desenvolvedor Júnior
- Desenvolvedor Pleno
- Desenvolvedor Sênior
- Tech Lead

### Design
- Designer Júnior
- Designer Pleno
- Designer Sênior

### RH
- Analista de RH
- Coordenador de RH

### Comercial
- Vendedor
- Vendedor Sênior

### Marketing
- Analista de Marketing
- Especialista de Marketing

### QA
- QA Júnior
- QA Pleno

---

## ✅ Verificação

Após executar o script, você deve ver:

```
✅ Haendell encontrado: Haendell Lopes (ID: xxx)
✅ Vanessa encontrada: Vanessa (ID: xxx)
✅ Departamentos verificados/criados
✅ Cargos verificados/criados
✅ 15 usuários inseridos com sucesso!
```

---

## 🐛 Solução de Problemas

### Erro: "Usuário Haendell não encontrado"

**Solução:**
1. Verifique se o usuário Haendell existe no sistema
2. Verifique se o nome está correto (pode ter variações)
3. Execute uma consulta manual:

```sql
SELECT id, name FROM users 
WHERE LOWER(name) LIKE '%haendell%';
```

### Erro: "Usuário Vanessa não encontrado"

**Solução:** Similar ao erro acima, mas para Vanessa.

### Nenhum usuário foi inserido

**Possíveis causas:**
1. Usuários já existem (ON CONFLICT DO NOTHING)
2. Formato de telefone incorreto
3. Restrições de banco de dados

**Solução:**
Execute uma consulta manual para verificar:

```sql
SELECT COUNT(*) FROM users 
WHERE tenant_id = '5978f911-738b-4aae-802a-f037fdac2e64';
```

---

## 📝 Estrutura da Tabela users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  position VARCHAR(255),           -- DEPRECATED
  department VARCHAR(255),          -- DEPRECATED
  position_id UUID,                 -- NOVO: FK para positions
  department_id UUID,               -- NOVO: FK para departments
  gestor_id UUID,                   -- NOVO: FK para users
  buddy_id UUID,                    -- NOVO: FK para users
  role VARCHAR(50) DEFAULT 'colaborador',
  status VARCHAR(50) DEFAULT 'active',
  onboarding_status VARCHAR(50) DEFAULT 'nao_iniciado',
  start_date DATE,
  onboarding_inicio DATE,
  onboarding_fim DATE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## 🔗 Arquivos Relacionados

- `adicionar-15-usuarios.sql` - Script SQL puro
- `adicionar-15-usuarios.js` - Script Node.js (versão 1)
- `adicionar-15-usuarios-v2.js` - Script Node.js (versão 2 - **RECOMENDADO**)

---

## 📞 Suporte

Se encontrar problemas, verifique:
1. Logs do console
2. Mensagens de erro detalhadas
3. Status do banco de dados no Supabase
4. Validação das foreign keys (gestor_id, buddy_id)

---

**Data de Criação:** 2025-01-14  
**Última Atualização:** 2025-01-14

