# 🧪 TESTE MANUAL - FLOWLY

## ✅ O Que Já Foi Corrigido

1. ✅ **GeminiService** - Modelo atualizado para `gemini-1.5-flash-latest`
2. ✅ **DATABASE_URL** - Conexão testada e funcionando!
3. ✅ **Fallback de análise** - Sistema funciona sem Gemini se necessário
4. ✅ **Todas variáveis** configuradas no `.env`

## 🔧 Como Testar

### Passo 1: Abrir Novo Terminal

Abra um **NOVO terminal PowerShell** no VSCode/Cursor:
- `Ctrl + Shift + '` (novo terminal)
- OU: Menu Terminal → New Terminal

### Passo 2: Navegar para o Projeto

```powershell
cd C:\Users\haendell.lopes\Documents\policy-agent-poc
```

### Passo 3: Iniciar o Servidor

```powershell
npm run dev
```

**Aguarde e observe os logs!** Você deve ver:

```
✅ Rotas modulares carregadas: auth, trilhas, colaborador...
Inicializando PostgreSQL...
Pool PostgreSQL inicializado com configurações serverless
🚀 Flowly API rodando em http://localhost:3000
📊 Database: PostgreSQL (Supabase)
```

### Passo 4: EM OUTRO TERMINAL, Testar a API

Abra **OUTRO terminal** (mantenha o servidor rodando no primeiro!) e execute:

```powershell
cd C:\Users\haendell.lopes\Documents\policy-agent-poc
node test-db-connection.js
```

Deve mostrar:
```
✅ CONEXÃO OK com DATABASE_URL!
```

### Passo 5: Testar Análise de Sentimento

No mesmo segundo terminal:

```powershell
$body = @{
    message = "Estou adorando o onboarding! Muito legal! 😊"
    userId = "test-user-123"
    context = "Teste"
    tenantId = "test-tenant"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:3000/api/analise-sentimento `
    -Method POST `
    -Body $body `
    -ContentType "application/json" `
    -UseBasicParsing
```

### Passo 6: Verificar Resultado

Se tudo estiver OK, você verá:

```json
{
  "success": true,
  "sentiment": {
    "sentimento": "muito_positivo",
    "intensidade": 0.85,
    "fatores_detectados": {
      "palavras_chave": ["adorando", "legal"],
      "tom": "empolgado",
      "indicadores": ["emoji", "pontuacao"]
    }
  },
  "record": { ... }
}
```

## ⚠️ Possíveis Erros

### Erro: "password authentication failed"

**Causa:** Senha do banco incorreta ou caracteres especiais não encoded

**Solução:**
1. Vá no Supabase: https://supabase.com/dashboard
2. Settings → Database → **Connection string** (URI)
3. **COPIE A STRING COMPLETA** (ela já tem a senha encoded)
4. Cole no `.env` em `DATABASE_URL=`

### Erro: "gemini-1.5-flash is not found"

**Causa:** Modelo desatualizado

**Solução:** Já corrigi! O modelo agora é `gemini-1.5-flash-latest`

### Erro: "GOOGLE_GEMINI_API_KEY não configurada"

**Causa:** API key vazia ou inválida

**Solução:** 
- **Opção 1:** Deixe vazio - o sistema usará fallback (análise simples)
- **Opção 2:** Pegue nova key em https://makersuite.google.com/app/apikey

## 📊 Status das Correções

| Item | Status |
|------|--------|
| Erro de `searchParams` | ✅ CORRIGIDO |
| Modelo Gemini | ✅ ATUALIZADO |
| DATABASE_URL | ✅ FUNCIONANDO |
| Fallback de sentimento | ✅ IMPLEMENTADO |
| Variáveis .env | ✅ CONFIGURADAS |

## 🎯 Resumo

**TUDO PRONTO!** Só falta você:
1. Iniciar o servidor (`npm run dev`)
2. Testar os endpoints
3. Me avisar se funcionou! 🚀

