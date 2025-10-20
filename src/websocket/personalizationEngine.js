const axios = require('axios');

class PersonalizationEngine {
  // Usar APIs existentes - NÃO criar novas queries
  async loadUserContext(userId) {
    try {
      // Usar endpoint existente do backend
      const response = await axios.get(`http://localhost:3000/api/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao carregar contexto:', error);
      return { 
        id: userId, 
        name: 'Usuário',
        position: 'N/A',
        department: 'N/A',
        sentimento_atual: 'neutro',
        sentimento_intensidade: 0.5
      };
    }
  }

  async loadConversationHistory(userId) {
    try {
      // Usar endpoint existente para histórico
      const response = await axios.get(`http://localhost:3000/api/conversations/${userId}`);
      return response.data || [];
    } catch (error) {
      console.error('❌ Erro ao carregar histórico:', error);
      return [];
    }
  }

  async loadOnboardingProgress(userId) {
    try {
      // Usar endpoint existente para progresso
      const response = await axios.get(`http://localhost:3000/api/agent-trilhas/colaborador/${userId}`);
      return response.data || { trilhas_concluidas: 0, trilhas_ativas: [] };
    } catch (error) {
      console.error('❌ Erro ao carregar progresso:', error);
      return { trilhas_concluidas: 0, trilhas_ativas: [] };
    }
  }

  generateSystemMessage(userContext, pageContext) {
    const { name, position, department, sentimento_atual, sentimento_intensidade, role } = userContext;
    
    // Detectar se é administrador
    const isAdmin = role === 'admin' || pageContext?.userType === 'admin';
    
    // Determinar tom baseado no sentimento
    const toneConfig = this.getToneBySentiment(sentimento_atual);
    
    return `Você é o **Navi**, assistente de onboarding inteligente e proativo.

🎯 **CONTEXTO ATUAL:**
- **Usuário:** ${name}
- **Cargo:** ${position}
- **Departamento:** ${department}
- **Tipo:** ${isAdmin ? 'ADMINISTRADOR' : 'COLABORADOR'}
- **Sentimento:** ${sentimento_atual} (${sentimento_intensidade}%)
- **Página atual:** ${pageContext?.page || 'Dashboard'}
${pageContext?.trilha_visualizando ? `- **Trilha Visualizando:** ${pageContext.trilha_visualizando}` : ''}
${pageContext?.conteudo_atual ? `- **Conteúdo Atual:** ${pageContext.conteudo_atual}` : ''}

🎭 **TOM DE VOZ:** ${toneConfig.tom} ${toneConfig.emoji}

${isAdmin ? `
🎯 **MODO ADMINISTRADOR ATIVADO:**
- Você tem acesso a ferramentas avançadas de análise
- Seja proativo em identificar problemas e oportunidades
- Gere insights estratégicos baseados em dados
- Sugira ações preventivas e melhorias
- Foque em métricas de performance e ROI
` : ''}

${sentimento_atual?.includes('negativo') ? `
⚠️ **ATENÇÃO - SENTIMENTO NEGATIVO:**
- Seja EXTRA empático e acolhedor
- Ouça ativamente e valide os sentimentos
- Ofereça ajuda IMEDIATA e CONCRETA
- Não minimize problemas
- Mostre que você está aqui para ajudar de verdade
` : ''}

${sentimento_atual?.includes('positivo') ? `
🎉 **OPORTUNIDADE - SENTIMENTO POSITIVO:**
- Celebre as conquistas do colaborador
- Mantenha o momentum positivo
- Sugira próximos passos desafiadores
- Reforce o progresso alcançado
` : ''}

🔧 **SUAS FERRAMENTAS DISPONÍVEIS:**

**PARA COLABORADORES:**
- buscar_trilhas_disponiveis: Lista trilhas do colaborador
- iniciar_trilha: Inicia trilha específica
- registrar_feedback: Registra feedback sobre trilhas
- buscar_documentos: Busca semântica em documentos

**PARA ADMINISTRADORES (FASE 5 - AGENTE PROATIVO):**
- analisar_performance_colaboradores: Analisa performance e identifica riscos
- gerar_relatorio_onboarding: Gera relatórios automáticos (executivo/operacional)
- criar_alertas_personalizados: Sistema de alertas inteligentes
- identificar_gargalos_trilhas: Detecta problemas em trilhas

**INSTRUÇÕES IMPORTANTES:**
- SEMPRE use as ferramentas quando apropriado
- Para administradores, seja proativo em usar as ferramentas de análise
- Quando o usuário pedir análise, relatórios ou alertas, USE as ferramentas correspondentes
- Não responda sem usar ferramentas quando elas são necessárias

SEMPRE use as ferramentas apropriadas baseadas no tipo de usuário e seja proativo!`;
  }

  getToneBySentiment(sentimento) {
    const tones = {
      'muito_positivo': { tom: 'ENTUSIASMADO e CELEBRATIVO', emoji: '🎉' },
      'positivo': { tom: 'MOTIVADOR e ENCORAJADOR', emoji: '👏' },
      'neutro': { tom: 'PROFISSIONAL, CLARO e PRESTATIVO', emoji: '✨' },
      'negativo': { tom: 'EMPÁTICO e COMPREENSIVO', emoji: '🤝' },
      'muito_negativo': { tom: 'EXTREMAMENTE EMPÁTICO e ACOLHEDOR', emoji: '💙' }
    };
    return tones[sentimento] || tones['neutro'];
  }

  getEmojiBySentiment(sentimento) {
    const emojis = {
      'muito_positivo': '😍',
      'positivo': '😊',
      'neutro': '😐',
      'negativo': '😔',
      'muito_negativo': '😡'
    };
    return emojis[sentimento] || '🤖';
  }

  // Método para gerar contexto completo do usuário
  async generateFullUserContext(userId, pageContext = {}) {
    try {
      // Carregar dados em paralelo para melhor performance
      const [userProfile, conversationHistory, onboardingProgress] = await Promise.all([
        this.loadUserContext(userId),
        this.loadConversationHistory(userId),
        this.loadOnboardingProgress(userId)
      ]);

      return {
        userId,
        profile: userProfile,
        conversationHistory: conversationHistory.slice(-10), // Últimas 10 mensagens
        onboardingProgress,
        pageContext,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erro ao gerar contexto completo:', error);
      return {
        userId,
        profile: { id: userId, name: 'Usuário', sentimento_atual: 'neutro' },
        conversationHistory: [],
        onboardingProgress: { trilhas_concluidas: 0, trilhas_ativas: [] },
        pageContext,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = PersonalizationEngine;
