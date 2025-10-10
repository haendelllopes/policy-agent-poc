# 🚀 Plano de Implementação Prático - Começar AGORA

**Data:** 10 de outubro de 2025  
**Status:** Pronto para começar

---

## ✅ O Que Já Temos

1. ✅ **Banco de Dados**: Supabase PostgreSQL configurado
2. ✅ **Backend**: Express rodando com rotas básicas
3. ✅ **N8N**: Webhook configurado
4. ✅ **Documentação**: Completa e pronta
5. ✅ **Migrações SQL**: Prontas para executar

---

## 🎯 Implementação em 3 Etapas

### 📅 Etapa 1: HOJE (2-3 horas)
**Objetivo:** Executar migrações e configurar infraestrutura

### 📅 Etapa 2: AMANHÃ (4-6 horas)
**Objetivo:** Implementar Fase 1 - Trilhas por Cargo/Departamento

### 📅 Etapa 3: PRÓXIMA SEMANA (1-2 semanas)
**Objetivo:** Implementar Fases 2 e 3 - Sentimento e Anotações

---

## 🔥 ETAPA 1: HOJE (Começar Agora!)

### Passo 1: Preparar Ambiente (15 min)

```bash
# 1. Instalar dependências do Gemini
cd policy-agent-poc
npm install @google/generative-ai

# 2. Verificar se está tudo ok
npm install

# 3. Criar arquivo .env se não existir
cp config.env.example .env
```

#### Editar `.env` e adicionar:
```bash
# Adicionar ao final do arquivo .env:
GEMINI_API_KEY=sua_chave_aqui  # Deixar em branco por enquanto
```

---

### Passo 2: Executar Migrações no Supabase (30 min)

#### Opção A: Via SQL Editor do Supabase (Recomendado)

1. Acesse: https://supabase.com/dashboard/project/[SEU_PROJECT_ID]/sql

2. Execute as migrações **NA ORDEM**:

**Migração 1: Trilhas por Cargo/Departamento**
```sql
-- Copiar todo o conteúdo de:
-- migrations/006_trilhas_segmentacao.sql
-- Colar no SQL Editor
-- Executar (RUN)
```

**Aguarde finalizar, depois:**

**Migração 2: Análise de Sentimento**
```sql
-- Copiar todo o conteúdo de:
-- migrations/005_colaborador_sentimentos.sql
-- Colar no SQL Editor
-- Executar (RUN)
```

**Aguarde finalizar, depois:**

**Migração 3: Bloco de Notas do Agente**
```sql
-- Copiar todo o conteúdo de:
-- migrations/004_agente_anotacoes.sql
-- Colar no SQL Editor
-- Executar (RUN)
```

**Aguarde finalizar, depois:**

**Migração 4: Recomendação por Sentimento**
```sql
-- Copiar todo o conteúdo de:
-- migrations/007_trilhas_recomendacao_sentimento.sql
-- Colar no SQL Editor
-- Executar (RUN)
```

#### Opção B: Via Terminal (se tiver psql instalado)

```bash
# Conectar ao Supabase
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres"

# Executar migrações na ordem
\i migrations/006_trilhas_segmentacao.sql
\i migrations/005_colaborador_sentimentos.sql
\i migrations/004_agente_anotacoes.sql
\i migrations/007_trilhas_recomendacao_sentimento.sql
```

---

### Passo 3: Verificar Migrações (10 min)

No SQL Editor do Supabase, execute:

```sql
-- Verificar se as tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_name IN (
    'trilha_segmentacao',
    'colaborador_sentimentos',
    'agente_anotacoes',
    'trilhas'
  )
ORDER BY table_name;

-- Verificar se as colunas novas foram adicionadas em trilhas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'trilhas'
  AND column_name IN (
    'segmentacao_tipo',
    'segmentacao_config',
    'sentimento_medio',
    'dificuldade_percebida',
    'taxa_conclusao'
  );

-- Verificar se as funções foram criadas
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name IN (
    'colaborador_tem_acesso_trilha',
    'buscar_trilhas_por_sentimento',
    'calcular_sentimento_trilha'
  );
```

**Resultado Esperado:** Deve retornar todas as tabelas, colunas e funções!

---

### Passo 4: Criar API Key do Gemini (5 min)

1. Acesse: https://makersuite.google.com/app/apikey
2. Clique em "Create API Key"
3. Escolha um projeto ou crie um novo
4. Copie a chave (começa com `AIzaSy...`)
5. Cole no arquivo `.env`:

```bash
GEMINI_API_KEY=AIzaSy...sua_chave_aqui
```

---

## 🚀 ETAPA 2: AMANHÃ - Implementar Fase 1

### Passo 1: Criar Endpoints de Segmentação (2h)

Criar arquivo: `src/routes/trilha-segmentacao.js`

```javascript
const express = require('express');
const router = express.Router();
const { query } = require('../db-pg');

// GET /api/trilhas/:id/segmentacao - Buscar configuração
router.get('/:trilhaId/segmentacao', async (req, res) => {
  try {
    const { trilhaId } = req.params;
    
    const result = await query(`
      SELECT 
        t.segmentacao_tipo,
        t.segmentacao_config,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ts.id,
              'department_id', ts.department_id,
              'department_name', d.name,
              'position_id', ts.position_id,
              'position_name', p.name,
              'incluir', ts.incluir
            )
          ) FILTER (WHERE ts.id IS NOT NULL),
          '[]'
        ) as segmentacoes
      FROM trilhas t
      LEFT JOIN trilha_segmentacao ts ON ts.trilha_id = t.id
      LEFT JOIN departments d ON d.id = ts.department_id
      LEFT JOIN positions p ON p.id = ts.position_id
      WHERE t.id = $1
      GROUP BY t.id, t.segmentacao_tipo, t.segmentacao_config
    `, [trilhaId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trilha não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar segmentação:', error);
    res.status(500).json({ error: 'Erro ao buscar segmentação' });
  }
});

// PUT /api/trilhas/:id/segmentacao - Atualizar segmentação
router.put('/:trilhaId/segmentacao', async (req, res) => {
  try {
    const { trilhaId } = req.params;
    const { tipo, departamentos, cargos } = req.body;
    
    // Validar tipo
    const tiposValidos = ['todos', 'departamentos', 'cargos', 'departamentos_cargos'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({ 
        error: `Tipo inválido. Use: ${tiposValidos.join(', ')}` 
      });
    }
    
    // Atualizar trilha
    await query(`
      UPDATE trilhas 
      SET segmentacao_tipo = $1,
          updated_at = NOW()
      WHERE id = $2
    `, [tipo, trilhaId]);
    
    // Limpar segmentações antigas
    await query(`
      DELETE FROM trilha_segmentacao 
      WHERE trilha_id = $1
    `, [trilhaId]);
    
    // Inserir novas segmentações
    if (tipo === 'departamentos' && departamentos?.length > 0) {
      for (const deptId of departamentos) {
        await query(`
          INSERT INTO trilha_segmentacao (trilha_id, department_id, incluir)
          VALUES ($1, $2, true)
        `, [trilhaId, deptId]);
      }
    }
    
    if (tipo === 'cargos' && cargos?.length > 0) {
      for (const posId of cargos) {
        await query(`
          INSERT INTO trilha_segmentacao (trilha_id, position_id, incluir)
          VALUES ($1, $2, true)
        `, [trilhaId, posId]);
      }
    }
    
    if (tipo === 'departamentos_cargos' && departamentos?.length > 0 && cargos?.length > 0) {
      // Combinação de departamento + cargo
      for (const deptId of departamentos) {
        for (const posId of cargos) {
          await query(`
            INSERT INTO trilha_segmentacao (trilha_id, department_id, position_id, incluir)
            VALUES ($1, $2, $3, true)
          `, [trilhaId, deptId, posId]);
        }
      }
    }
    
    res.json({ success: true, message: 'Segmentação atualizada' });
  } catch (error) {
    console.error('Erro ao atualizar segmentação:', error);
    res.status(500).json({ error: 'Erro ao atualizar segmentação' });
  }
});

// GET /api/trilhas/colaborador/:userId - Trilhas disponíveis
router.get('/colaborador/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await query(`
      SELECT 
        t.id,
        t.nome,
        t.descricao,
        t.prazo_dias,
        t.ordem,
        t.segmentacao_tipo,
        colaborador_tem_acesso_trilha($1, t.id) as tem_acesso,
        ct.status as meu_status
      FROM trilhas t
      LEFT JOIN colaborador_trilhas ct ON ct.trilha_id = t.id AND ct.colaborador_id = $1
      WHERE t.ativo = true
        AND t.tenant_id = (SELECT tenant_id FROM users WHERE id = $1)
        AND colaborador_tem_acesso_trilha($1, t.id) = true
      ORDER BY t.ordem, t.nome
    `, [userId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar trilhas do colaborador:', error);
    res.status(500).json({ error: 'Erro ao buscar trilhas' });
  }
});

module.exports = router;
```

---

### Passo 2: Registrar Rota no Server (5 min)

Editar `src/server.js` e adicionar:

```javascript
// Adicionar após as outras rotas
const trilhaSegmentacaoRoutes = require('./routes/trilha-segmentacao');
app.use('/api/trilhas', trilhaSegmentacaoRoutes);
```

---

### Passo 3: Testar API (30 min)

```bash
# Iniciar servidor
npm run dev

# Em outro terminal, testar:

# 1. Buscar trilhas de um colaborador
curl http://localhost:3000/api/trilhas/colaborador/[USER_ID]

# 2. Configurar segmentação de uma trilha
curl -X PUT http://localhost:3000/api/trilhas/[TRILHA_ID]/segmentacao \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "departamentos",
    "departamentos": ["dept-uuid-1", "dept-uuid-2"]
  }'

# 3. Verificar segmentação
curl http://localhost:3000/api/trilhas/[TRILHA_ID]/segmentacao
```

---

### Passo 4: Criar Interface Admin (2h)

Criar arquivo: `public/admin-trilhas-segmentacao.html`

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Configurar Segmentação - Flowly</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
    <div class="max-w-4xl mx-auto p-8">
        <h1 class="text-3xl font-bold mb-8">Configurar Segmentação de Trilhas</h1>
        
        <!-- Seletor de Trilha -->
        <div class="bg-white p-6 rounded-lg shadow mb-6">
            <label class="block mb-2 font-semibold">Selecione a Trilha:</label>
            <select id="trilhaSelect" class="w-full p-2 border rounded">
                <option value="">Carregando...</option>
            </select>
        </div>
        
        <!-- Configuração -->
        <div id="configSection" class="bg-white p-6 rounded-lg shadow hidden">
            <h2 class="text-xl font-semibold mb-4">Quem pode acessar esta trilha?</h2>
            
            <div class="space-y-4">
                <label class="flex items-center">
                    <input type="radio" name="tipo" value="todos" class="mr-2">
                    <span>Todos os colaboradores</span>
                </label>
                
                <label class="flex items-center">
                    <input type="radio" name="tipo" value="departamentos" class="mr-2">
                    <span>Departamentos específicos</span>
                </label>
                <div id="deptSection" class="ml-6 hidden">
                    <select id="deptSelect" multiple class="w-full p-2 border rounded h-32">
                    </select>
                </div>
                
                <label class="flex items-center">
                    <input type="radio" name="tipo" value="cargos" class="mr-2">
                    <span>Cargos específicos</span>
                </label>
                <div id="posSection" class="ml-6 hidden">
                    <select id="posSelect" multiple class="w-full p-2 border rounded h-32">
                    </select>
                </div>
                
                <label class="flex items-center">
                    <input type="radio" name="tipo" value="departamentos_cargos" class="mr-2">
                    <span>Combinação de Departamento + Cargo</span>
                </label>
                <div id="comboSection" class="ml-6 hidden">
                    <p class="text-sm text-gray-600 mb-2">Selecione departamentos E cargos</p>
                    <label class="block mb-2">Departamentos:</label>
                    <select id="deptComboSelect" multiple class="w-full p-2 border rounded h-24 mb-4">
                    </select>
                    <label class="block mb-2">Cargos:</label>
                    <select id="posComboSelect" multiple class="w-full p-2 border rounded h-24">
                    </select>
                </div>
            </div>
            
            <button id="saveBtn" class="mt-6 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                Salvar Configuração
            </button>
        </div>
    </div>
    
    <script>
        // Script básico - expandir conforme necessário
        const API_URL = 'http://localhost:3000/api';
        
        // Carregar trilhas
        async function loadTrilhas() {
            const res = await fetch(`${API_URL}/trilhas`);
            const trilhas = await res.json();
            const select = document.getElementById('trilhaSelect');
            select.innerHTML = '<option value="">Selecione uma trilha</option>';
            trilhas.forEach(t => {
                select.innerHTML += `<option value="${t.id}">${t.nome}</option>`;
            });
        }
        
        // Carregar departamentos e cargos
        async function loadOptions() {
            const [depts, positions] = await Promise.all([
                fetch(`${API_URL}/departments`).then(r => r.json()),
                fetch(`${API_URL}/positions`).then(r => r.json())
            ]);
            
            // Preencher selects
            ['deptSelect', 'deptComboSelect'].forEach(id => {
                const select = document.getElementById(id);
                depts.forEach(d => {
                    select.innerHTML += `<option value="${d.id}">${d.name}</option>`;
                });
            });
            
            ['posSelect', 'posComboSelect'].forEach(id => {
                const select = document.getElementById(id);
                positions.forEach(p => {
                    select.innerHTML += `<option value="${p.id}">${p.name}</option>`;
                });
            });
        }
        
        // Ao selecionar trilha
        document.getElementById('trilhaSelect').addEventListener('change', async (e) => {
            const trilhaId = e.target.value;
            if (!trilhaId) return;
            
            document.getElementById('configSection').classList.remove('hidden');
            
            // Carregar configuração atual
            const res = await fetch(`${API_URL}/trilhas/${trilhaId}/segmentacao`);
            const config = await res.json();
            
            // Marcar tipo
            document.querySelector(`input[value="${config.segmentacao_tipo}"]`).checked = true;
            // Trigger change
            document.querySelector(`input[value="${config.segmentacao_tipo}"]`).dispatchEvent(new Event('change'));
        });
        
        // Mostrar/ocultar seções conforme tipo
        document.querySelectorAll('input[name="tipo"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                document.querySelectorAll('[id$="Section"]').forEach(el => el.classList.add('hidden'));
                
                if (e.target.value === 'departamentos') {
                    document.getElementById('deptSection').classList.remove('hidden');
                } else if (e.target.value === 'cargos') {
                    document.getElementById('posSection').classList.remove('hidden');
                } else if (e.target.value === 'departamentos_cargos') {
                    document.getElementById('comboSection').classList.remove('hidden');
                }
            });
        });
        
        // Salvar
        document.getElementById('saveBtn').addEventListener('click', async () => {
            const trilhaId = document.getElementById('trilhaSelect').value;
            const tipo = document.querySelector('input[name="tipo"]:checked').value;
            
            let departamentos = [];
            let cargos = [];
            
            if (tipo === 'departamentos') {
                departamentos = Array.from(document.getElementById('deptSelect').selectedOptions).map(o => o.value);
            } else if (tipo === 'cargos') {
                cargos = Array.from(document.getElementById('posSelect').selectedOptions).map(o => o.value);
            } else if (tipo === 'departamentos_cargos') {
                departamentos = Array.from(document.getElementById('deptComboSelect').selectedOptions).map(o => o.value);
                cargos = Array.from(document.getElementById('posComboSelect').selectedOptions).map(o => o.value);
            }
            
            const res = await fetch(`${API_URL}/trilhas/${trilhaId}/segmentacao`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tipo, departamentos, cargos })
            });
            
            if (res.ok) {
                alert('Configuração salva com sucesso!');
            } else {
                alert('Erro ao salvar');
            }
        });
        
        // Inicializar
        loadTrilhas();
        loadOptions();
    </script>
</body>
</html>
```

---

## ✅ Checklist de Hoje

- [ ] Instalar `@google/generative-ai`
- [ ] Criar `.env` com `GEMINI_API_KEY`
- [ ] Executar 4 migrações no Supabase
- [ ] Verificar que tabelas foram criadas
- [ ] Criar API Key do Gemini
- [ ] Testar com query SQL básica

**Tempo estimado:** 2-3 horas

---

## 📞 Precisa de Ajuda?

Se tiver algum erro durante a implementação:
1. Copie a mensagem de erro
2. Me mostre
3. Vamos resolver juntos!

---

**Pronto para começar?** Vamos fazer isso! 🚀

