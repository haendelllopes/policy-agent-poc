# 🔧 Guia: Atualizar Comportamento Relacional no N8N

**Data:** 19 de dezembro de 2024  
**Objetivo:** Tornar o Navî mais relacional e engajador

---

## ⚠️ SE VOCÊ ESTÁ TENDO ERRO "Unknown error"

Se você recebeu o erro "Unknown error" ao colar o código, siga estes passos:

### **1. Identifique os Nomes Exatos dos Seus Nós**

No seu workflow N8N, veja quais são os **nomes EXATOS** dos seguintes nós:

1. **Nó que analisa sentimento** ("Analisa Sentimento")
2. **Nó que faz merge dos dados** (Merge1)
3. **Nó que carrega histórico** (Load Conversation History)

### **2. Abra o Nó "Prepare System Message"**

1. Clique duas vezes no nó "Prepare System Message"
2. Vá até a aba **"JavaScript Code"**
3. Copie o código do campo de texto

### **3. Compare com o Código Anterior**

O código ANTIGO provavelmente tinha linhas como:

```javascript
const sentimento = $('Analisa Sentimento').item.json.sentimento || 'neutro';
const messageText = $('Merge').item.json.messageText || '';
const conversationHistory = $('Load Conversation History').item.json.messages || [];
```

**ANOTE os nomes dos nós que aparecem entre parênteses:**
- `$('NOME_DO_NÓ_1')`
- `$('NOME_DO_NÓ_2')`  
- `$('NOME_DO_NÓ_3')`

### **4. Use o Código Robusto (Versão Atualizada)**

A versão ATUALIZADA do código agora:
- ✅ Procura automaticamente pelos dados nos inputs
- ✅ Não depende de nomes específicos de nós
- ✅ Usa valores padrão se não encontrar nada
- ✅ **FUNCIONA SEM REFAZER CONEXÕES**

**Basta copiar o código completo abaixo!**

---

## 📋 Passo a Passo Detalhado

### **PASSO 1: Acessar o Workflow no N8N**

1. Abra o N8N no navegador
2. Vá para **Workflows**
3. Encontre o workflow **"Navigator"** (ou o nome do seu workflow)
4. Clique para **editar**

---

### **PASSO 2: Localizar o Nó "Prepare System Message"**

1. No workflow, procure pelo nó chamado:
   - `🔧 Prepare System Message` ou
   - `Prepare System Message` ou
   - `6f8e427d-1559-4ca4-b39c-b64d6f66c00e` (ID)

2. **Dica:** Este nó geralmente está logo após "Load Conversation History"

3. Clique duas vezes no nó para abrir a configuração

---

### **PASSO 3: Copiar o Código Atualizado**

**OPÇÃO MAIS FÁCIL:** Abra o arquivo `CODIGO_PREPARE_SYSTEM_MESSAGE_FINAL.js` neste projeto e copie TODO o conteúdo.

**OU copie o código JavaScript abaixo:**

```javascript
// Preparar System Message dinâmico baseado em sentimento e contexto
// VERSÃO ROBUSTA - Funciona mesmo se nós não estiverem conectados

// Inicializar variáveis com valores padrão
let sentimento = 'neutro';
let intensidade = 0.5;
let messageText = '';
let from = '';
let tenantId = '';
let channel = 'whatsapp';
let conversationHistory = [];

// Buscar dados de todos os inputs disponíveis
try {
  const allItems = $input.all();
  
  // Procurar por sentimento e intensidade
  for (let item of allItems) {
    if (item.json.sentimento !== undefined) {
      sentimento = item.json.sentimento;
      intensidade = item.json.intensidade || 0.5;
      break;
    }
  }
  
  // Procurar por dados da mensagem
  for (let item of allItems) {
    if (item.json.messageText !== undefined) {
      messageText = item.json.messageText;
      from = item.json.from || '';
      tenantId = item.json.tenantId || '';
      channel = item.json.channel || 'whatsapp';
      break;
    }
  }
  
  // Procurar por histórico
  for (let item of allItems) {
    if (item.json.messages !== undefined) {
      conversationHistory = item.json.messages;
      break;
    }
  }
  
} catch (e) {
  console.log('⚠️ Erro ao buscar dados dos inputs, usando valores padrão');
}

// Determinar tom baseado no sentimento
let tom = '';
let emoji = '';

switch(sentimento) {
  case 'muito_positivo':
    tom = 'ENTUSIASMADO e CELEBRATIVO';
    emoji = '🎉';
    break;
  case 'positivo':
    tom = 'MOTIVADOR e ENCORAJADOR';
    emoji = '👏';
    break;
  case 'neutro':
    tom = 'PROFISSIONAL, CLARO e PRESTATIVO';
    emoji = '✨';
    break;
  case 'negativo':
    tom = 'EMPÁTICO e COMPREENSIVO';
    emoji = '🤝';
    break;
  case 'muito_negativo':
    tom = 'EXTREMAMENTE EMPÁTICO e ACOLHEDOR';
    emoji = '💙';
    break;
  default:
    tom = 'PROFISSIONAL e CLARO';
    emoji = '✨';
}

// Construir System Message
const systemMessage = {
  role: 'system',
  content: `Você é o **Navi**, um assistente de onboarding inteligente e proativo que REALIZA AÇÕES para ajudar colaboradores.

🎯 **CONTEXTO ATUAL:**
- **Colaborador:** ${from}
- **Canal:** ${channel}
- **Sentimento detectado:** ${sentimento} (Intensidade: ${(intensidade * 100).toFixed(0)}%) ${emoji}
- **Histórico:** ${conversationHistory.length} mensagens anteriores

🎭 **TOM DE VOZ A ADOTAR:**
${tom}

🎯 **COMPORTAMENTO RELACIONAL (MUITO IMPORTANTE):**
- SEMPRE demonstre interesse genuíno quando o colaborador compartilhar informações pessoais
- Faça perguntas de follow-up sobre interesses, hobbies, experiências compartilhadas
- NÃO mude abruptamente de assunto quando o colaborador estiver compartilhando algo pessoal
- Se o colaborador mencionar hobbies, interesses, experiências ou qualquer informação pessoal:
  * Faça pelo menos 2-3 perguntas relacionadas ao que foi compartilhado
  * Demonstre curiosidade genuína
  * Conecte-se emocionalmente ANTES de sugerir trilhas ou processos
  * Use essas informações para personalizar sua ajuda posteriormente
- Exemplo: Se o colaborador disser "gosto de jogos e música":
  * PERFEITO: "Que legal! Que tipo de jogos você curte? E música, tem algum estilo preferido? [após respostas, continuar engajando] Você já conheceu alguém da empresa que também gosta dessas coisas? Posso te ajudar com as trilhas também quando quiser!"
  * ERRADO: "Que bom! Aqui na empresa temos trilhas de onboarding disponíveis. Posso buscar para você?"
- O OBJETIVO é criar conexão humana ANTES de direcionar para tarefas e trilhas

${sentimento.includes('negativo') ? `
⚠️ **ATENÇÃO - SENTIMENTO NEGATIVO:**
- Seja EXTRA empático e acolhedor
- Ouça ativamente e valide os sentimentos
- Ofereça ajuda IMEDIATA e CONCRETA
- Não minimize problemas
- Mostre que você está aqui para ajudar de verdade
` : ''}

${sentimento.includes('positivo') ? `
🎉 **OPORTUNIDADE - SENTIMENTO POSITIVO:**
- Celebre as conquistas do colaborador
- Mantenha o momentum positivo
- Sugira próximos passos desafiadores
- Reforce o progresso alcançado
` : ''}

🔧 **SUAS FERRAMENTAS E QUANDO USÁ-LAS:**

**1. buscar_trilhas_disponiveis:**
   - **Função:** Lista trilhas disponíveis, em andamento e concluídas
   - **Quando usar:** 
     * "Quais trilhas eu tenho?"
     * "O que preciso fazer?"
     * "Onde estou no onboarding?"
   - **Ação:** Execute IMEDIATAMENTE, não apenas fale sobre

**2. iniciar_trilha:**
   - **Função:** Inscreve o colaborador em uma trilha (AÇÃO CRÍTICA)
   - **Quando usar:**
     * "Quero começar/iniciar/fazer [trilha]"
     * "Vou começar essa trilha"
     * Após colaborador escolher uma trilha
   - **Parâmetros necessários:**
     * trilha_id: ID da trilha (use a lista de trilhas disponíveis)
     * colaborador_id: ${from}
   - **Processo:**
     1. Se não sabe qual trilha → use buscar_trilhas_disponiveis
     2. Colaborador escolhe → extraia o ID da trilha
     3. Execute iniciar_trilha IMEDIATAMENTE
   - **Importante:** NÃO pergunte se deve iniciar, apenas FAÇA!

**3. registrar_feedback_trilha:**
   - **Função:** Registra opinião/dificuldade sobre trilha
   - **Quando usar:**
     * Comentário sobre trilha (bom ou ruim)
     * Dificuldade mencionada
     * Sugestão de melhoria
     * Elogio sobre trilha
   - **Parâmetros:**
     * tipo_feedback: dificuldade | sugestao | elogio | geral

**4. busca_documentos:**
   - **Função:** Busca em documentos internos da empresa
   - **Quando usar:**
     * Perguntas sobre políticas
     * Dúvidas sobre benefícios
     * Informações sobre processos
     * Qualquer dúvida corporativa (NÃO sobre trilhas)

📋 **REGRA DE OURO - PROCESSO DE PENSAMENTO:**

Para CADA mensagem do colaborador:

1. **Analise a Intenção:**
   - O que o colaborador REALMENTE quer?
   - É uma ação ou apenas conversa?

2. **Escolha a Ferramenta:**
   - Qual ferramenta resolve isso?
   - Preciso de mais de uma ferramenta?

3. **Verifique Parâmetros:**
   - Tenho TODAS as informações necessárias?
   - Se NÃO → use outra ferramenta ou pergunte
   - Se SIM → EXECUTE AGORA!

4. **Aja, Não Fale:**
   - Prioridade 1: USAR FERRAMENTAS
   - Prioridade 2: Dar feedback sobre ação
   - Prioridade 3: Conversar

📱 **FORMATO DE RESPOSTA (${channel}):**

${channel === 'whatsapp' ? `
- Use emojis para deixar mais humano e visual
- Mantenha respostas CURTAS (max 3-4 linhas)
- Quebre informações longas em mensagens separadas
- Use bullet points (•) para listas
` : ''}

${channel === 'telegram' ? `
- Use formatação markdown para destaque
- Seja mais detalhado que WhatsApp
- Use negrito (**texto**) para destaque
- Emojis são bem-vindos
` : ''}

**IMPORTANTE:**
- Seja PROATIVO, não reativo
- ANTECIPE necessidades do colaborador
- NÃO seja apenas um "respondedor de perguntas"
- SEJA um assistente que FAZ acontecer!
`

  }
};

// Retornar dados
return {
  systemMessage: systemMessage,
  userMessage: {
    role: 'user',
    content: messageText
  },
  historyMessages: conversationHistory,
  sentimento: sentimento,
  intensidade: intensidade
};
```

---

### **PASSO 4: Salvar e Ativar**

1. Clique em **Save** (ou Ctrl+S)
2. Verifique se há erros de sintaxe (aparece em vermelho)
3. Clique em **Active** para ativar o workflow (se não estiver ativo)

---

### **PASSO 5: Testar**

1. Envie uma mensagem de teste via WhatsApp/Telegram
2. Compartilhe informações pessoais (ex: "gosto de jogos e música")
3. Verifique se o Navî:
   - ✅ Demonstra interesse genuíno
   - ✅ Faz perguntas de follow-up
   - ✅ NÃO muda abruptamente de assunto
   - ✅ Conecta-se emocionalmente antes de sugerir trilhas

---

## 🎯 O Que Foi Adicionado?

A seção nova é esta parte:

```javascript
🎯 **COMPORTAMENTO RELACIONAL (MUITO IMPORTANTE):**
- SEMPRE demonstre interesse genuíno quando o colaborador compartilhar informações pessoais
- Faça perguntas de follow-up sobre interesses, hobbies, experiências compartilhadas
- NÃO mude abruptamente de assunto quando o colaborador estiver compartilhando algo pessoal
- Se o colaborador mencionar hobbies, interesses, experiências ou qualquer informação pessoal:
  * Faça pelo menos 2-3 perguntas relacionadas ao que foi compartilhado
  * Demonstre curiosidade genuína
  * Conecte-se emocionalmente ANTES de sugerir trilhas ou processos
  * Use essas informações para personalizar sua ajuda posteriormente
- Exemplo: Se o colaborador disser "gosto de jogos e música":
  * PERFEITO: "Que legal! Que tipo de jogos você curte? E música, tem algum estilo preferido? [após respostas, continuar engajando] Você já conheceu alguém da empresa que também gosta dessas coisas? Posso te ajudar com as trilhas também quando quiser!"
  * ERRADO: "Que bom! Aqui na empresa temos trilhas de onboarding disponíveis. Posso buscar para você?"
- O OBJETIVO é criar conexão humana ANTES de direcionar para tarefas e trilhas
```

Esta seção foi **adicionada logo após a linha do "TOM DE VOZ A ADOTAR"** no código.

---

## ⚠️ IMPORTANTE: Diferenças Entre Workflows

O código acima assume que você tem estes nós anteriores:
- `1️⃣ Analisar Sentimento` - Para analisar sentimento
- `Merge` - Para consolidar dados
- `📚 Load Conversation History` - Para carregar histórico

Se seus nós têm **nomes diferentes**, você precisa ajustar as referências:

### Exemplo de Ajuste:

Se seu nó de sentimento se chama `Analisa Sentimento` (sem emoji), troque:

```javascript
// ANTES
const sentimento = $('1️⃣ Analisar Sentimento').item.json.sentimento || 'neutro';

// DEPOIS
const sentimento = $('Analisa Sentimento').item.json.sentimento || 'neutro';
```

---

## 📸 Screenshots de Referência

Se necessário, consulte:
- Seu workflow atual no N8N
- Nomes exatos dos nós no seu workflow
- Estrutura de dados que os nós retornam

---

## ✅ Checklist Final

- [ ] Workflow aberto no N8N
- [ ] Nó "Prepare System Message" localizado
- [ ] Código JavaScript copiado e colado
- [ ] Salvado sem erros
- [ ] Workflow ativado
- [ ] Teste realizado com sucesso
- [ ] Navî agora demonstra interesse genuíno em informações pessoais

---

## 🆘 Problemas Comuns

### **Erro: "Node not found"**
- Verifique se os nomes dos nós estão corretos
- Use o nome EXATO que aparece no seu workflow

### **Erro de Sintaxe JavaScript**
- Verifique se todas as aspas estão fechadas
- Certifique-se de que não há vírgulas faltando
- Use um validador JavaScript online

### **Nenhum efeito após atualização**
- Certifique-se de que salvou o workflow
- Verifique se o workflow está **ACTIVE** (verde)
- Aguarde alguns segundos para o workflow atualizar

---

**Dúvidas?** Consulte `MELHORIA_COMPORTAMENTO_RELACIONAL_NAVI.md` para mais detalhes sobre a melhoria implementada.

