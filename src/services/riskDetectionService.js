// src/services/riskDetectionService.js
/**
 * SERVIÇO DE DETECÇÃO DE RISCOS
 * Fase 5: Agente Proativo Autônomo
 * 
 * Detecta colaboradores em risco baseado em padrões de comportamento,
 * sentimentos e progresso nas trilhas
 */

const { query } = require('../db-pg');

class RiskDetectionService {
  constructor() {
    this.riskThresholds = {
      baixo: 30,
      medio: 60,
      alto: 80,
      critico: 90
    };
    
    console.log('🔍 RiskDetectionService inicializado');
  }

  /**
   * Detecta colaboradores em risco para um tenant
   * @param {string} tenantId - ID do tenant
   * @param {Object} options - Opções de análise
   * @returns {Array} Lista de colaboradores em risco
   */
  async detectarColaboradoresEmRisco(tenantId, options = {}) {
    try {
      console.log('🔍 Detectando colaboradores em risco para tenant:', tenantId);
      
      const {
        departamento = null,
        diasAnalise = 30,
        scoreMinimo = 30,
        incluirInativos = false
      } = options;

      // Buscar colaboradores ativos do tenant
      const colaboradoresQuery = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.department,
          u.position,
          u.sentimento_atual,
          u.sentimento_atualizado_em,
          u.risk_score,
          u.risk_score_atualizado_em,
          u.ultima_atividade_em,
          u.created_at as data_admissao
        FROM users u
        WHERE u.tenant_id = $1
          AND u.active = true
          ${departamento ? 'AND u.department = $2' : ''}
          ${incluirInativos ? '' : 'AND u.ultima_atividade_em > NOW() - INTERVAL \'7 days\''}
        ORDER BY u.risk_score DESC NULLS LAST, u.name
      `;

      const colaboradoresParams = departamento ? [tenantId, departamento] : [tenantId];
      const colaboradoresResult = await query(colaboradoresQuery, colaboradoresParams);
      const colaboradores = colaboradoresResult.rows;

      console.log(`📊 Analisando ${colaboradores.length} colaboradores`);

      const colaboradoresEmRisco = [];

      // Analisar cada colaborador
      for (const colaborador of colaboradores) {
        const riscoData = await this.calcularScoreRisco(colaborador, tenantId, diasAnalise);
        
        if (riscoData.score >= scoreMinimo) {
          colaboradoresEmRisco.push({
            ...colaborador,
            ...riscoData,
            nivel_risco: this.getNivelRisco(riscoData.score),
            cor_risco: this.getCorRisco(riscoData.score)
          });
        }
      }

      console.log(`⚠️ Encontrados ${colaboradoresEmRisco.length} colaboradores em risco`);
      
      return colaboradoresEmRisco;

    } catch (error) {
      console.error('❌ Erro ao detectar colaboradores em risco:', error);
      throw error;
    }
  }

  async detectarColaboradoresEmRisco(tenantId, criterios = {}) {
    console.log(`RiskDetectionService: Detectando colaboradores em risco para tenant ${tenantId}`);
    
    const { scoreMinimo = 60, departamento = null, diasAnalise = 30 } = criterios;
    
    let usersQuery = `SELECT id, nome, email FROM users WHERE tenant_id = $1`;
    const queryParams = [tenantId];

    if (departamento) {
      usersQuery += ` AND departamento = $2`;
      queryParams.push(departamento);
    }

    const usersResult = await query(usersQuery, queryParams);
    const colaboradores = usersResult.rows;
    const colaboradoresEmRisco = [];

    for (const colaborador of colaboradores) {
      const risk = await this.calculateRiskScore(tenantId, colaborador.id);
      
      if (risk.score >= scoreMinimo) {
        colaboradoresEmRisco.push({
          id: colaborador.id,
          name: colaborador.nome,
          email: colaborador.email,
          score: risk.score,
          nivel_risco: risk.nivel_risco,
          principais_fatores: risk.principais_fatores
        });
      }
    }

    return colaboradoresEmRisco;
  }

  /**
   * Calcula score de risco para um colaborador específico
   * @param {Object} colaborador - Dados do colaborador
   * @param {string} tenantId - ID do tenant
   * @param {number} diasAnalise - Dias para análise
   * @returns {Object} Dados de risco calculados
   */
  async calcularScoreRisco(colaborador, tenantId, diasAnalise = 30) {
    try {
      const colaboradorId = colaborador.id;
      let scoreTotal = 0;
      const fatores = [];
      const acoes = [];

      // 1. ANÁLISE DE SENTIMENTO (peso: 30%)
      const sentimentoScore = await this.analisarSentimento(colaboradorId, tenantId, diasAnalise);
      scoreTotal += sentimentoScore.score * 0.3;
      if (sentimentoScore.score > 0) {
        fatores.push(sentimentoScore.fator);
        acoes.push(...sentimentoScore.acoes);
      }

      // 2. ANÁLISE DE TRILHAS (peso: 25%)
      const trilhasScore = await this.analisarTrilhas(colaboradorId, tenantId);
      scoreTotal += trilhasScore.score * 0.25;
      if (trilhasScore.score > 0) {
        fatores.push(trilhasScore.fator);
        acoes.push(...trilhasScore.acoes);
      }

      // 3. ANÁLISE DE ATIVIDADE (peso: 20%)
      const atividadeScore = await this.analisarAtividade(colaboradorId, tenantId, diasAnalise);
      scoreTotal += atividadeScore.score * 0.2;
      if (atividadeScore.score > 0) {
        fatores.push(atividadeScore.fator);
        acoes.push(...atividadeScore.acoes);
      }

      // 4. ANÁLISE DE PADRÕES COMPORTAMENTAIS (peso: 15%)
      const padroesScore = await this.identificarPadroesComportamento(colaboradorId, tenantId, diasAnalise);
      scoreTotal += padroesScore.score * 0.15;
      if (padroesScore.score > 0) {
        fatores.push(padroesScore.fator);
        acoes.push(...padroesScore.acoes);
      }

      // 5. ANÁLISE DE FEEDBACK (peso: 10%)
      const feedbackScore = await this.analisarFeedback(colaboradorId, tenantId, diasAnalise);
      scoreTotal += feedbackScore.score * 0.1;
      if (feedbackScore.score > 0) {
        fatores.push(feedbackScore.fator);
        acoes.push(...feedbackScore.acoes);
      }

      // Normalizar score para 0-100
      const scoreFinal = Math.min(Math.round(scoreTotal), 100);

      return {
        score: scoreFinal,
        fatores: fatores,
        acoes: [...new Set(acoes)], // Remove duplicatas
        principais_fatores: fatores.slice(0, 3),
        nivel_risco: this.getNivelRisco(scoreFinal),
        detalhes: {
          sentimento: sentimentoScore,
          trilhas: trilhasScore,
          atividade: atividadeScore,
          padroes: padroesScore,
          feedback: feedbackScore
        }
      };

    } catch (error) {
      console.error('❌ Erro ao calcular score de risco:', error);
      return {
        score: 0,
        fatores: [],
        acoes: [],
        principais_fatores: [],
        nivel_risco: 'baixo',
        detalhes: {}
      };
    }
  }

  /**
   * Analisa sentimento do colaborador
   */
  async analisarSentimento(colaboradorId, tenantId, diasAnalise) {
    try {
      const sentimentoQuery = `
        SELECT 
          sentimento,
          intensidade,
          created_at,
          origem
        FROM colaborador_sentimentos
        WHERE colaborador_id = $1 
          AND tenant_id = $2
          AND created_at > NOW() - INTERVAL '${diasAnalise} days'
        ORDER BY created_at DESC
        LIMIT 10
      `;

      const result = await query(sentimentoQuery, [colaboradorId, tenantId]);
      const sentimentos = result.rows;

      if (sentimentos.length === 0) {
        return { score: 0, fator: null, acoes: [] };
      }

      // Calcular score baseado no sentimento atual e tendência
      const sentimentoAtual = sentimentos[0];
      const sentimentoScore = this.getSentimentoScore(sentimentoAtual.sentimento, sentimentoAtual.intensidade);

      // Verificar tendência (últimos 3 sentimentos)
      const tendencia = this.calcularTendenciaSentimento(sentimentos.slice(0, 3));
      
      let score = sentimentoScore;
      if (tendencia === 'piorando') score += 20;
      if (tendencia === 'melhorando') score -= 10;

      const fator = `Sentimento ${sentimentoAtual.sentimento} (${tendencia})`;
      const acoes = this.getAcoesSentimento(sentimentoAtual.sentimento, tendencia);

      return { score: Math.max(0, score), fator, acoes };

    } catch (error) {
      console.error('❌ Erro ao analisar sentimento:', error);
      return { score: 0, fator: null, acoes: [] };
    }
  }

  /**
   * Analisa progresso nas trilhas
   */
  async analisarTrilhas(colaboradorId, tenantId) {
    try {
      const trilhasQuery = `
        SELECT 
          ct.status,
          ct.progresso_percentual,
          ct.data_inicio,
          ct.data_limite,
          ct.data_conclusao,
          t.nome as trilha_nome,
          t.prazo_dias,
          CASE 
            WHEN ct.data_limite < NOW() AND ct.status != 'concluida' THEN true
            ELSE false
          END as atrasada
        FROM colaborador_trilhas ct
        JOIN trilhas t ON t.id = ct.trilha_id
        WHERE ct.colaborador_id = $1 
          AND ct.tenant_id = $2
        ORDER BY ct.data_inicio DESC
      `;

      const result = await query(trilhasQuery, [colaboradorId, tenantId]);
      const trilhas = result.rows;

      if (trilhas.length === 0) {
        return { score: 0, fator: null, acoes: [] };
      }

      let score = 0;
      const fatores = [];
      const acoes = [];

      // Trilhas atrasadas
      const trilhasAtrasadas = trilhas.filter(t => t.atrasada);
      if (trilhasAtrasadas.length > 0) {
        score += trilhasAtrasadas.length * 15;
        fatores.push(`${trilhasAtrasadas.length} trilha(s) atrasada(s)`);
        acoes.push('Agendar reunião de acompanhamento');
      }

      // Baixo progresso geral
      const progressoMedio = trilhas.reduce((acc, t) => acc + (t.progresso_percentual || 0), 0) / trilhas.length;
      if (progressoMedio < 30) {
        score += 25;
        fatores.push(`Progresso baixo (${Math.round(progressoMedio)}%)`);
        acoes.push('Revisar metodologia de aprendizado');
      }

      // Muitas trilhas iniciadas mas não concluídas
      const trilhasIniciadas = trilhas.filter(t => t.status === 'em_andamento').length;
      if (trilhasIniciadas > 3) {
        score += 20;
        fatores.push(`${trilhasIniciadas} trilhas em andamento`);
        acoes.push('Focar em conclusão de trilhas prioritárias');
      }

      const fator = fatores.length > 0 ? fatores.join(', ') : null;
      return { score: Math.min(score, 100), fator, acoes };

    } catch (error) {
      console.error('❌ Erro ao analisar trilhas:', error);
      return { score: 0, fator: null, acoes: [] };
    }
  }

  /**
   * Analisa atividade do colaborador
   */
  async analisarAtividade(colaboradorId, tenantId, diasAnalise) {
    try {
      const atividadeQuery = `
        SELECT 
          MAX(created_at) as ultima_atividade,
          COUNT(*) as total_interacoes
        FROM conversation_history
        WHERE user_id = $1 
          AND tenant_id = $2
          AND created_at > NOW() - INTERVAL '${diasAnalise} days'
      `;

      const result = await query(atividadeQuery, [colaboradorId, tenantId]);
      const atividade = result.rows[0];

      let score = 0;
      const fatores = [];
      const acoes = [];

      // Inatividade prolongada
      if (atividade.ultima_atividade) {
        const diasInativo = Math.floor((new Date() - new Date(atividade.ultima_atividade)) / (1000 * 60 * 60 * 24));
        if (diasInativo > 5) {
          score += Math.min(diasInativo * 5, 50);
          fatores.push(`${diasInativo} dias sem atividade`);
          acoes.push('Contato proativo para engajamento');
        }
      } else {
        score += 40;
        fatores.push('Nunca interagiu com o sistema');
        acoes.push('Primeiro contato e onboarding presencial');
      }

      // Baixa frequência de interação
      if (atividade.total_interacoes < 3) {
        score += 20;
        fatores.push('Poucas interações com o sistema');
        acoes.push('Incentivar uso do chatbot');
      }

      const fator = fatores.length > 0 ? fatores.join(', ') : null;
      return { score: Math.min(score, 100), fator, acoes };

    } catch (error) {
      console.error('❌ Erro ao analisar atividade:', error);
      return { score: 0, fator: null, acoes: [] };
    }
  }

  /**
   * Identifica padrões comportamentais
   */
  async identificarPadroesComportamento(colaboradorId, tenantId, diasAnalise) {
    try {
      const padroesQuery = `
        SELECT 
          tipo,
          COUNT(*) as frequencia,
          AVG(proactive_score) as score_medio,
          MAX(created_at) as ultimo_evento
        FROM agente_anotacoes
        WHERE colaborador_id = $1 
          AND tenant_id = $2
          AND created_at > NOW() - INTERVAL '${diasAnalise} days'
        GROUP BY tipo
        HAVING COUNT(*) >= 2
        ORDER BY frequencia DESC
      `;

      const result = await query(padroesQuery, [colaboradorId, tenantId]);
      const padroes = result.rows;

      let score = 0;
      const fatores = [];
      const acoes = [];

      // Padrão de dificuldades recorrentes
      const dificuldades = padroes.filter(p => p.tipo === 'dificuldade_conteudo');
      if (dificuldades.length > 0) {
        score += 25;
        fatores.push('Dificuldades recorrentes reportadas');
        acoes.push('Oferecer mentoria especializada');
      }

      // Padrão de sentimentos negativos
      const sentimentosNegativos = padroes.filter(p => p.tipo === 'sentimento_empresa' && p.score_medio > 60);
      if (sentimentosNegativos.length > 0) {
        score += 30;
        fatores.push('Sentimentos negativos consistentes');
        acoes.push('Escalação para RH');
      }

      const fator = fatores.length > 0 ? fatores.join(', ') : null;
      return { score: Math.min(score, 100), fator, acoes };

    } catch (error) {
      console.error('❌ Erro ao identificar padrões:', error);
      return { score: 0, fator: null, acoes: [] };
    }
  }

  /**
   * Analisa feedback do colaborador
   */
  async analisarFeedback(colaboradorId, tenantId, diasAnalise) {
    try {
      const feedbackQuery = `
        SELECT 
          tipo,
          sentimento,
          tags,
          created_at
        FROM agente_anotacoes
        WHERE colaborador_id = $1 
          AND tenant_id = $2
          AND tipo IN ('sugestao_colaborador', 'dificuldade_conteudo')
          AND created_at > NOW() - INTERVAL '${diasAnalise} days'
        ORDER BY created_at DESC
      `;

      const result = await query(feedbackQuery, [colaboradorId, tenantId]);
      const feedbacks = result.rows;

      let score = 0;
      const fatores = [];
      const acoes = [];

      // Feedback negativo frequente
      const feedbacksNegativos = feedbacks.filter(f => 
        f.sentimento === 'negativo' || f.sentimento === 'muito_negativo'
      );
      
      if (feedbacksNegativos.length >= 2) {
        score += 20;
        fatores.push('Feedback negativo frequente');
        acoes.push('Investigar causas raiz');
      }

      // Tags indicativas de problemas
      const tagsProblemas = feedbacks.flatMap(f => f.tags || [])
        .filter(tag => tag.includes('problema') || tag.includes('dificuldade') || tag.includes('confuso'));
      
      if (tagsProblemas.length >= 3) {
        score += 15;
        fatores.push('Múltiplos problemas reportados');
        acoes.push('Revisar conteúdo das trilhas');
      }

      const fator = fatores.length > 0 ? fatores.join(', ') : null;
      return { score: Math.min(score, 100), fator, acoes };

    } catch (error) {
      console.error('❌ Erro ao analisar feedback:', error);
      return { score: 0, fator: null, acoes: [] };
    }
  }

  // ============================================
  // MÉTODOS AUXILIARES
  // ============================================

  getSentimentoScore(sentimento, intensidade) {
    const scores = {
      'muito_positivo': 0,
      'positivo': 10,
      'neutro': 30,
      'negativo': 70,
      'muito_negativo': 90
    };
    
    const baseScore = scores[sentimento] || 0;
    const intensidadeMultiplier = intensidade || 0.5;
    
    return Math.round(baseScore * intensidadeMultiplier);
  }

  calcularTendenciaSentimento(sentimentos) {
    if (sentimentos.length < 2) return 'estavel';
    
    const scores = sentimentos.map(s => this.getSentimentoScore(s.sentimento, s.intensidade));
    const primeiro = scores[0];
    const ultimo = scores[scores.length - 1];
    
    if (ultimo > primeiro + 20) return 'piorando';
    if (ultimo < primeiro - 20) return 'melhorando';
    return 'estavel';
  }

  getAcoesSentimento(sentimento, tendencia) {
    const acoes = {
      'muito_negativo': ['Contato imediato do RH', 'Reunião com gestor'],
      'negativo': ['Acompanhamento próximo', 'Oferta de suporte'],
      'neutro': ['Verificar satisfação', 'Incentivar feedback'],
      'positivo': ['Manter engajamento', 'Reconhecer progresso'],
      'muito_positivo': ['Parabenizar', 'Sugerir mentoria']
    };
    
    let acoesBase = acoes[sentimento] || [];
    
    if (tendencia === 'piorando') {
      acoesBase.push('Intervenção urgente');
    }
    
    return acoesBase;
  }

  getNivelRisco(score) {
    if (score >= this.riskThresholds.critico) return 'critico';
    if (score >= this.riskThresholds.alto) return 'alto';
    if (score >= this.riskThresholds.medio) return 'medio';
    return 'baixo';
  }

  getCorRisco(score) {
    const nivel = this.getNivelRisco(score);
    const cores = {
      'baixo': '#10b981',
      'medio': '#f59e0b',
      'alto': '#f97316',
      'critico': '#ef4444'
    };
    return cores[nivel];
  }

  /**
   * Atualiza score de risco no banco de dados
   */
  async atualizarScoreRisco(colaboradorId, scoreData) {
    try {
      await query(`
        UPDATE users 
        SET risk_score = $1,
            risk_score_atualizado_em = NOW()
        WHERE id = $2
      `, [scoreData.score, colaboradorId]);
      
      console.log(`✅ Score de risco atualizado para colaborador ${colaboradorId}: ${scoreData.score}`);
      
    } catch (error) {
      console.error('❌ Erro ao atualizar score de risco:', error);
    }
  }
}

module.exports = new RiskDetectionService();
