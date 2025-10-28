// Versão que inclui trilhas no contexto
// Esta versão busca trilhas disponíveis e adiciona ao system message

// Coletar todos os inputs disponíveis
const allInputs = $input.all();

// Inicializar variáveis
let sentimento = 'neutro';
let intensidade = 0.5;
let messageText = '';
let from = '';
let channel = 'whatsapp';
let tenantId = '';
let conversationHistory = [];

// Extrair dados dos inputs
if (allInputs && allInputs.length > 0) {
  for (let input of allInputs) {
    // Buscar sentimento
    if (input.json.sentimento) {
      sentimento = input.json.sentimento;
    }
    if (input.json.intensidade) {
      intensidade = input.json.intensidade;
    }
    
    // Buscar dados da mensagem
    if (input.json.messageText) {
      messageText = input.json.messageText;
    }
    if (input.json.from) {
      from = input.json.from;
    }
    if (input.json.channel) {
      channel = input.json.channel;
    }
    if (input.json.tenantId) {
      tenantId = input.json.tenantId;
    }
    
    // Buscar histórico
    if (input.json.messages) {
      conversationHistory = input.json.messages;
    }
  }
}

// ✅ NOVO: Buscar trilhas disponíveis do colaborador
let trilhasInfo = '';
let trilhasDisponiveis = [];
let backendUrl = 'http://localhost:3000'; // Padrão local

try {
  // Tentar obter URL do backend
  for (let input of allInputs) {
    if (input.json.url && input.json.url.includes('localhost') || input.json.url.includes('vercel')) {
      backendUrl = input.json.url;
      break;
    }
  }
  
  if (from && tenantId) {
    const response = await fetch(`${backendUrl}/api/agent-n8n/trilhas/disponiveis/${from}?tenant_id=${tenantId}`);
    if (response.ok) {
      const data = await response.json();
      trilhasDisponiveis = data.disponiveis || [];
      
      // Formatar informações das trilhas para o contexto
      if (trilhasDisponiveis.length > 0) {
        trilhasInfo = '\n\n📚 **TRILHAS DISPONÍVEIS PARA ESTE COLABORADOR:**\n\n';
        
        trilhasDisponiveis.forEach((trilha, index) => {
          trilhasInfo += `${index + 1}. **${trilha.nome}** (ID: ${trilha.id})\n`;
          if (trilha.descricao) {
            trilhasInfo += `   Descrição: ${trilha.descricao}\n`;
          }
          if (trilha.conteudos_count) {
            trilhasInfo += `   Conteúdos: ${trilha.conteudos_count}\n`;
          }
          trilhasInfo += '\n';
        });
        
        trilhasInfo += '\n**IMPORTANTE:** Você conhece estas trilhas e pode usá-las para responder perguntas e iniciar trilhas quando solicitado.';
      }
    }
  }
} catch (error) {
  console.log('⚠️ Não foi possível buscar trilhas:', error.message);
  trilhasInfo = '\n\n⚠️ **NOTA:** Use a ferramenta buscar_trilhas_disponiveis quando o colaborador perguntar sobre trilhas.';
}

// Determinar tom
let tom = 'PROFISSIONAL e CLARO';
let emoji = '✨';

switch(sentimento) {
  case 'muito_positivo':
    tom = 'ENTUSIASMADO e CELEBRATIVO';
    emoji = '🎉';
    break;
  case 'positivo':
    tom = 'MOTIVADOR e ENCORAJADOR';
    emoji = '👏';
    break;
  case 'negativo':
    tom = 'EMPÁTICO e COMPREENSIVO';
    emoji = '🤝';
    break;
  case 'muito_negativo':
    tom = 'EXTREMAMENTE EMPÁTICO e ACOLHEDOR';
    emoji = '💙';
    break;
}

// Construir system message
const systemContent = `Você é o **Navi**, um assistente de onboarding inteligente e proativo.

🎯 CONTEXTO: Colaborador ${from} | Sentimento: ${sentimento} | Histórico: ${conversationHistory.length} mensagens

🎭 TOM DE VOZ: ${tom} ${emoji}

${trilhasInfo}

🎯 COMPORTAMENTO RELACIONAL (MUITO IMPORTANTE):
- SEMPRE demonstre interesse genuíno quando o colaborador compartilhar informações pessoais
- Faça perguntas de follow-up sobre interesses, hobbies, experiências
- NÃO mude abruptamente de assunto quando o colaborador estiver compartilhando algo pessoal
- Se o colaborador mencionar hobbies/interesses:
  * Faça pelo menos 2-3 perguntas relacionadas
  * Demonstre curiosidade genuína
  * Conecte-se emocionalmente ANTES de sugerir trilhas
- O OBJETIVO é criar conexão humana ANTES de direcionar para tarefas

${sentimento.includes('negativo') ? `
⚠️ ATENÇÃO - SENTIMENTO NEGATIVO:
- Seja EXTRA empático e acolhedor
- Ouça ativamente e valide os sentimentos
- Ofereça ajuda IMEDIATA e CONCRETA
` : ''}

🔧 FERRAMENTAS DISPONÍVEIS:
1. buscar_trilhas_disponiveis - Lista trilhas
2. iniciar_trilha - Inicia trilha específica
3. registrar_feedback - Registra feedback
4. busca_documentos - Busca documentos

📋 REGRA DE OURO:
- Seja PROATIVO, não reativo
- ANTECIPE necessidades do colaborador
- NÃO seja apenas um "respondedor de perguntas"
- SEJA um assistente que FAZ acontecer!

📱 FORMATO:
- Use emojis para humanizar
- Respostas curtas e objetivas
- Quebre informações longas em partes`;

// Retornar
return {
  systemMessage: {
    role: 'system',
    content: systemContent
  },
  userMessage: {
    role: 'user',
    content: messageText
  },
  historyMessages: conversationHistory,
  sentimento: sentimento,
  intensidade: intensidade
};

