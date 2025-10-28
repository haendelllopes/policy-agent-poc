// VERSÃO DE TESTE - Retorna apenas o básico

// Retornar o formato esperado pelo N8N
return {
  systemMessage: {
    role: 'system',
    content: 'Você é o Navi, assistente de onboarding. Seja empático e faça perguntas de follow-up quando o colaborador compartilhar informações pessoais.'
  },
  userMessage: {
    role: 'user',
    content: 'Olá'
  },
  historyMessages: [],
  sentimento: 'neutro',
  intensidade: 0.5
};

