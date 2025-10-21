// src/services/proactiveEngine.js
/**
 * MOTOR PROATIVO - CÉREBRO DO SISTEMA
 * Fase 5: Agente Proativo Autônomo
 * 
 * Substitui implementação mock em adminTools.js por lógica real
 * Analisa dados, gera insights e sugere ações usando GPT-4o
 */

const { query } = require('../db-pg');
const riskDetectionService = require('./riskDetectionService');
const notificationService = require('./notificationService');

class ProactiveEngine {
  constructor() {
    this.openai = null;
    this.initializeOpenAI();
    console.log('🧠 ProactiveEngine inicializado');
  }

  async initializeOpenAI() {
    try {
      const OpenAI = require('openai');
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      console.log('✅ OpenAI inicializado no ProactiveEngine');
    } catch (error) {
      console.error('❌ Erro ao inicializar OpenAI:', error);
    }
  }

  /**
   * Analisa performance de colaboradores (substitui mock)
   * @param {string} tenantId - ID do tenant
   * @param {string} departamento - Departamento específico (opcional)
   * @param {number} periodo - Período em dias
   * @returns {Object} Análise completa de performance
   */
  async analisarPerformanceColaboradores(tenantId, departamento = null, periodo = 30) {
    try {
      console.log('📊 Analisando performance de colaboradores...');
      
      // Buscar dados reais do PostgreSQL
      const colaboradoresQuery = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.department,
          u.position,
          u.sentimento_atual,
          u.risk_score,
          u.created_at as data_admissao,
          COUNT(ct.id) as total_trilhas,
          COUNT(CASE WHEN ct.status = 'concluida' THEN 1 END) as trilhas_concluidas,
          AVG(ct.progresso_percentual) as progresso_medio,
          COUNT(CASE WHEN ct.data_limite < NOW() AND ct.status != 'concluida' THEN 1 END) as trilhas_atrasadas
        FROM users u
        LEFT JOIN colaborador_trilhas ct ON ct.colaborador_id = u.id
        WHERE u.tenant_id = $1
          AND u.active = true
          ${departamento ? 'AND u.department = $2' : ''}
        GROUP BY u.id, u.name, u.email, u.department, u.position, u.sentimento_atual, u.risk_score, u.created_at
        ORDER BY u.risk_score DESC NULLS LAST
      `;

      const params = departamento ? [tenantId, departamento] : [tenantId];
      const colaboradoresResult = await query(colaboradoresQuery, params);
      const colaboradores = colaboradoresResult.rows;

      // Calcular métricas agregadas
      const metricas = this.calcularMetricasPerformance(colaboradores);
      
      // Gerar insights usando GPT-4o
      const insights = await this.gerarInsightsPerformance(colaboradores, metricas);
      
      // Identificar colaboradores em risco
      const colaboradoresRisco = colaboradores.filter(c => c.risk_score >= 60);
      
      // Gerar sugestões de ações
      const sugestoes = await this.gerarSugestoesAcoes(colaboradoresRisco, metricas);

      return {
        periodo_analise: periodo,
        total_colaboradores: colaboradores.length,
        metricas,
        insights,
        colaboradores_risco: colaboradoresRisco.length,
        colaboradores_detalhados: colaboradores,
        sugestoes_acoes: sugestoes,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Erro ao analisar performance:', error);
      throw error;
    }
  }

  /**
   * Calcula métricas de performance agregadas
   */
  calcularMetricasPerformance(colaboradores) {
    const total = colaboradores.length;
    if (total === 0) return {};

    const metricas = {
      taxa_conclusao_trilhas: 0,
      tempo_medio_conclusao: 0,
      sentimento_medio: 0,
      colaboradores_atrasados: 0,
      colaboradores_risco_alto: 0,
      progresso_medio: 0
    };

    let totalTrilhas = 0;
    let trilhasConcluidas = 0;
    let totalProgresso = 0;
    let colaboradoresAtrasados = 0;
    let colaboradoresRiscoAlto = 0;
    let sentimentoTotal = 0;

    colaboradores.forEach(colaborador => {
      totalTrilhas += colaborador.total_trilhas || 0;
      trilhasConcluidas += colaborador.trilhas_concluidas || 0;
      totalProgresso += colaborador.progresso_medio || 0;
      
      if (colaborador.trilhas_atrasadas > 0) colaboradoresAtrasados++;
      if (colaborador.risk_score >= 80) colaboradoresRiscoAlto++;
      
      // Converter sentimento para número
      const sentimentoScore = this.getSentimentoScore(colaborador.sentimento_atual);
      sentimentoTotal += sentimentoScore;
    });

    metricas.taxa_conclusao_trilhas = totalTrilhas > 0 ? Math.round((trilhasConcluidas / totalTrilhas) * 100) : 0;
    metricas.progresso_medio = Math.round(totalProgresso / total);
    metricas.colaboradores_atrasados = colaboradoresAtrasados;
    metricas.colaboradores_risco_alto = colaboradoresRiscoAlto;
    metricas.sentimento_medio = Math.round(sentimentoTotal / total);

    return metricas;
  }

  async gerarRelatorioExecutivo(tenantId, periodoDias = 30) {
    console.log(`ProactiveEngine: Gerando relatório executivo para tenant ${tenantId}, período: ${periodoDias} dias`);
    
    // Buscar dados agregados para o relatório
    const totalColaboradores = await query(`SELECT COUNT(*) FROM users WHERE tenant_id = $1`, [tenantId]);
    const totalTrilhas = await query(`SELECT COUNT(*) FROM trilhas WHERE tenant_id = $1`, [tenantId]);
    const alertasAtivos = await query(`SELECT COUNT(*) FROM proactive_alerts WHERE tenant_id = $1 AND status = 'ativo'`, [tenantId]);
    const acoesPendentes = await query(`SELECT COUNT(*) FROM admin_actions WHERE tenant_id = $1 AND status = 'pendente_aprovacao'`, [tenantId]);

    // Calcular métricas de engajamento
    const sentimentosPositivos = await query(
      `SELECT COUNT(*) FROM colaborador_sentimentos 
       WHERE tenant_id = $1 AND sentimento = 'positivo' AND created_at > NOW() - INTERVAL '${periodoDias} days'`,
      [tenantId]
    );

    const sentimentosNegativos = await query(
      `SELECT COUNT(*) FROM colaborador_sentimentos 
       WHERE tenant_id = $1 AND sentimento = 'negativo' AND created_at > NOW() - INTERVAL '${periodoDias} days'`,
      [tenantId]
    );

    const totalSentimentos = parseInt(sentimentosPositivos.rows[0].count) + parseInt(sentimentosNegativos.rows[0].count);
    const percentualPositivo = totalSentimentos > 0 ? (parseInt(sentimentosPositivos.rows[0].count) / totalSentimentos * 100).toFixed(1) : 0;

    return {
      periodo: `${periodoDias} dias`,
      metricas_gerais: {
        total_colaboradores: parseInt(totalColaboradores.rows[0].count),
        total_trilhas: parseInt(totalTrilhas.rows[0].count),
        alertas_ativos: parseInt(alertasAtivos.rows[0].count),
        acoes_pendentes: parseInt(acoesPendentes.rows[0].count)
      },
      engajamento: {
        percentual_sentimento_positivo: parseFloat(percentualPositivo),
        total_sentimentos_analisados: totalSentimentos,
        sentimentos_positivos: parseInt(sentimentosPositivos.rows[0].count),
        sentimentos_negativos: parseInt(sentimentosNegativos.rows[0].count)
      },
      insights: [
        {
          titulo: "Status Geral do Onboarding",
          descricao: `O sistema possui ${totalColaboradores.rows[0].count} colaboradores ativos com ${totalTrilhas.rows[0].count} trilhas disponíveis.`,
          impacto: "info"
        },
        {
          titulo: "Nível de Engajamento",
          descricao: `${percentualPositivo}% dos sentimentos analisados são positivos, indicando um bom nível de engajamento.`,
          impacto: parseInt(percentualPositivo) >= 70 ? "positivo" : parseInt(percentualPositivo) >= 50 ? "neutro" : "negativo"
        },
        {
          titulo: "Alertas Ativos",
          descricao: `${alertasAtivos.rows[0].count} alertas proativos estão ativos, requerendo atenção dos administradores.`,
          impacto: parseInt(alertasAtivos.rows[0].count) > 5 ? "alto" : parseInt(alertasAtivos.rows[0].count) > 0 ? "medio" : "baixo"
        }
      ],
      timestamp: new Date().toISOString()
    };
  }

  async identificarGargalosTrilhas(tenantId, trilhaId = null, periodoDias = 30) {
    console.log(`ProactiveEngine: Identificando gargalos para tenant ${tenantId}, trilha: ${trilhaId}, período: ${periodoDias} dias`);
    
    let trilhasQuery = `SELECT id, nome FROM trilhas WHERE tenant_id = $1`;
    const queryParams = [tenantId];

    if (trilhaId) {
      trilhasQuery += ` AND id = $2`;
      queryParams.push(trilhaId);
    }

    const trilhasResult = await query(trilhasQuery, queryParams);
    const trilhas = trilhasResult.rows;
    const gargalos = [];

    for (const trilha of trilhas) {
      // Verificar dificuldades reportadas na trilha
      const dificuldades = await query(
        `SELECT COUNT(*) FROM agente_anotacoes 
         WHERE tenant_id = $1 AND trilha_id = $2 AND tipo = 'dificuldade_conteudo' AND created_at > NOW() - INTERVAL '${periodoDias} days'`,
        [tenantId, trilha.id]
      );

      // Verificar sentimentos negativos relacionados à trilha
      const sentimentosNegativos = await query(
        `SELECT COUNT(*) FROM colaborador_sentimentos 
         WHERE tenant_id = $1 AND trilha_id = $2 AND sentimento = 'negativo' AND created_at > NOW() - INTERVAL '${periodoDias} days'`,
        [tenantId, trilha.id]
      );

      // Verificar progresso lento (usuários que estão há muito tempo na trilha)
      const progressoLento = await query(
        `SELECT COUNT(*) FROM user_trilhas 
         WHERE tenant_id = $1 AND trilha_id = $2 AND status = 'em_andamento' AND created_at < NOW() - INTERVAL '${periodoDias} days'`,
        [tenantId, trilha.id]
      );

      const totalDificuldades = parseInt(dificuldades.rows[0].count);
      const totalSentimentosNegativos = parseInt(sentimentosNegativos.rows[0].count);
      const totalProgressoLento = parseInt(progressoLento.rows[0].count);

      if (totalDificuldades > 0 || totalSentimentosNegativos > 0 || totalProgressoLento > 0) {
        gargalos.push({
          trilha_id: trilha.id,
          trilha_nome: trilha.nome,
          dificuldades_reportadas: totalDificuldades,
          sentimentos_negativos: totalSentimentosNegativos,
          progresso_lento: totalProgressoLento,
          score_gargalo: (totalDificuldades * 2) + (totalSentimentosNegativos * 1.5) + (totalProgressoLento * 1),
          severidade: this.getGargaloSeveridade(totalDificuldades, totalSentimentosNegativos, totalProgressoLento),
          recomendacoes: this.gerarRecomendacoesGargalo(totalDificuldades, totalSentimentosNegativos, totalProgressoLento)
        });
      }
    }

    return gargalos;
  }

  getGargaloSeveridade(dificuldades, sentimentosNegativos, progressoLento) {
    const score = (dificuldades * 2) + (sentimentosNegativos * 1.5) + (progressoLento * 1);
    if (score >= 10) return 'critico';
    if (score >= 5) return 'alto';
    if (score >= 2) return 'medio';
    return 'baixo';
  }

  gerarRecomendacoesGargalo(dificuldades, sentimentosNegativos, progressoLento) {
    const recomendacoes = [];
    
    if (dificuldades > 0) {
      recomendacoes.push('Revisar conteúdo da trilha - múltiplas dificuldades reportadas');
    }
    if (sentimentosNegativos > 0) {
      recomendacoes.push('Investigar causas dos sentimentos negativos');
    }
    if (progressoLento > 0) {
      recomendacoes.push('Verificar se há bloqueios ou falta de suporte');
    }
    
    return recomendacoes;
  }

  /**
   * Gera insights usando GPT-4o
   */
  async gerarInsightsPerformance(colaboradores, metricas) {
    try {
      if (!this.openai) {
        return this.gerarInsightsMock(colaboradores, metricas);
      }

      const prompt = `
        Analise os dados de performance de colaboradores e gere insights acionáveis.
        
        DADOS:
        - Total de colaboradores: ${colaboradores.length}
        - Taxa de conclusão de trilhas: ${metricas.taxa_conclusao_trilhas}%
        - Progresso médio: ${metricas.progresso_medio}%
        - Sentimento médio: ${metricas.sentimento_medio}/100
        - Colaboradores atrasados: ${metricas.colaboradores_atrasados}
        - Colaboradores em risco alto: ${metricas.colaboradores_risco_alto}
        
        COLABORADORES EM RISCO:
        ${colaboradores.filter(c => c.risk_score >= 60).map(c => 
          `- ${c.name} (${c.department}): Score ${c.risk_score}, ${c.trilhas_atrasadas} trilhas atrasadas`
        ).join('\n')}
        
        Gere 3 insights principais e 2 recomendações específicas em formato JSON:
        {
          "insights": [
            {"titulo": "string", "descricao": "string", "impacto": "alto|medio|baixo"},
            {"titulo": "string", "descricao": "string", "impacto": "alto|medio|baixo"},
            {"titulo": "string", "descricao": "string", "impacto": "alto|medio|baixo"}
          ],
          "recomendacoes": [
            {"acao": "string", "prioridade": "alta|media|baixa", "prazo": "string"},
            {"acao": "string", "prioridade": "alta|media|baixa", "prazo": "string"}
          ]
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      });

      const insights = JSON.parse(response.choices[0].message.content);
      return insights;

    } catch (error) {
      console.error('❌ Erro ao gerar insights com GPT:', error);
      return this.gerarInsightsMock(colaboradores, metricas);
    }
  }

  /**
   * Gera insights mock quando GPT não está disponível
   */
  gerarInsightsMock(colaboradores, metricas) {
    const insights = [];
    const recomendacoes = [];

    // Insight 1: Taxa de conclusão
    if (metricas.taxa_conclusao_trilhas < 70) {
      insights.push({
        titulo: "Taxa de Conclusão Baixa",
        descricao: `Apenas ${metricas.taxa_conclusao_trilhas}% das trilhas são concluídas. Isso pode indicar dificuldades no processo de onboarding.`,
        impacto: "alto"
      });
      recomendacoes.push({
        acao: "Revisar metodologia das trilhas e oferecer suporte adicional",
        prioridade: "alta",
        prazo: "1 semana"
      });
    }

    // Insight 2: Colaboradores em risco
    if (metricas.colaboradores_risco_alto > 0) {
      insights.push({
        titulo: "Colaboradores em Risco Alto",
        descricao: `${metricas.colaboradores_risco_alto} colaboradores apresentam risco alto de evasão ou baixo engajamento.`,
        impacto: "alto"
      });
      recomendacoes.push({
        acao: "Contato proativo com colaboradores em risco",
        prioridade: "alta",
        prazo: "2 dias"
      });
    }

    // Insight 3: Sentimento geral
    if (metricas.sentimento_medio < 50) {
      insights.push({
        titulo: "Sentimento Geral Negativo",
        descricao: `Sentimento médio de ${metricas.sentimento_medio}/100 indica insatisfação geral com o processo.`,
        impacto: "medio"
      });
    }

    return { insights, recomendacoes };
  }

  /**
   * Gera sugestões de ações para colaboradores em risco
   */
  async gerarSugestoesAcoes(colaboradoresRisco, metricas) {
    const sugestoes = [];

    for (const colaborador of colaboradoresRisco) {
      const acoes = await this.gerarAcoesPersonalizadas(colaborador);
      sugestoes.push({
        colaborador_id: colaborador.id,
        colaborador_nome: colaborador.name,
        colaborador_departamento: colaborador.department,
        risk_score: colaborador.risk_score,
        acoes_sugeridas: acoes
      });
    }

    return sugestoes;
  }

  /**
   * Gera ações personalizadas para um colaborador específico
   */
  async gerarAcoesPersonalizadas(colaborador) {
    const acoes = [];

    // Ação baseada no score de risco
    if (colaborador.risk_score >= 90) {
      acoes.push({
        tipo: 'contatar_colaborador',
        titulo: 'Contato Urgente',
        descricao: 'Contato imediato para entender dificuldades',
        prioridade: 'critica',
        prazo: 'hoje'
      });
    } else if (colaborador.risk_score >= 70) {
      acoes.push({
        tipo: 'escalar_rh',
        titulo: 'Escalação para RH',
        descricao: 'RH deve acompanhar de perto este colaborador',
        prioridade: 'alta',
        prazo: '2 dias'
      });
    }

    // Ação baseada em trilhas atrasadas
    if (colaborador.trilhas_atrasadas > 0) {
      acoes.push({
        tipo: 'ajustar_trilha',
        titulo: 'Revisar Trilhas',
        descricao: 'Ajustar cronograma ou oferecer suporte adicional',
        prioridade: 'media',
        prazo: '1 semana'
      });
    }

    // Ação baseada no sentimento
    if (colaborador.sentimento_atual === 'negativo' || colaborador.sentimento_atual === 'muito_negativo') {
      acoes.push({
        tipo: 'criar_ticket',
        titulo: 'Investigar Causas',
        descricao: 'Criar ticket para investigar causas do sentimento negativo',
        prioridade: 'alta',
        prazo: '3 dias'
      });
    }

    return acoes;
  }

  /**
   * Monitoramento contínuo (executado a cada 15 minutos)
   */
  async monitoramentoContinuo(tenantId) {
    try {
      console.log('🔄 Executando monitoramento contínuo...');
      
      const resultados = {
        alertas_criados: 0,
        colaboradores_analisados: 0,
        notificacoes_enviadas: 0
      };

      // Detectar colaboradores em risco
      const colaboradoresRisco = await riskDetectionService.detectarColaboradoresEmRisco(tenantId, {
        scoreMinimo: 70,
        diasAnalise: 7
      });

      resultados.colaboradores_analisados = colaboradoresRisco.length;

      // Criar alertas para riscos críticos
      for (const colaborador of colaboradoresRisco) {
        if (colaborador.score >= 80) {
          await this.criarAlertaCritico(colaborador, tenantId);
          resultados.alertas_criados++;
        }
      }

      // Verificar mudanças críticas de sentimento
      const mudancasSentimento = await this.detectarMudancasSentimento(tenantId);
      resultados.alertas_criados += mudancasSentimento.length;

      console.log('✅ Monitoramento contínuo concluído:', resultados);
      return resultados;

    } catch (error) {
      console.error('❌ Erro no monitoramento contínuo:', error);
      throw error;
    }
  }

  /**
   * Cria alerta crítico para colaborador
   */
  async criarAlertaCritico(colaborador, tenantId) {
    try {
      const alertaQuery = `
        INSERT INTO agente_anotacoes (
          tenant_id,
          colaborador_id,
          tipo,
          titulo,
          anotacao,
          severidade,
          proactive_score,
          alerta_gerado,
          contexto,
          tags
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
        )
        RETURNING id
      `;

      const tipoAlerta = this.getTipoAlerta(colaborador);
      const titulo = `🚨 ${tipoAlerta}: ${colaborador.name}`;
      const anotacao = `Colaborador com score de risco ${colaborador.score}. Fatores: ${colaborador.principais_fatores.join(', ')}`;
      
      const contexto = {
        risk_score: colaborador.score,
        fatores: colaborador.fatores,
        acoes: colaborador.acoes,
        nivel_risco: colaborador.nivel_risco
      };

      const tags = ['risco_alto', 'alerta_critico', colaborador.department];

      const result = await query(alertaQuery, [
        tenantId,
        colaborador.id,
        tipoAlerta,
        titulo,
        anotacao,
        'critica',
        colaborador.score,
        true,
        JSON.stringify(contexto),
        tags
      ]);

      console.log(`🚨 Alerta crítico criado: ${result.rows[0].id}`);
      return result.rows[0].id;

    } catch (error) {
      console.error('❌ Erro ao criar alerta crítico:', error);
    }
  }

  /**
   * Detecta mudanças críticas de sentimento
   */
  async detectarMudancasSentimento(tenantId) {
    try {
      const mudancasQuery = `
        SELECT 
          cs.colaborador_id,
          u.name,
          cs.sentimento,
          cs.intensidade,
          cs.created_at,
          LAG(cs.sentimento) OVER (PARTITION BY cs.colaborador_id ORDER BY cs.created_at) as sentimento_anterior
        FROM colaborador_sentimentos cs
        JOIN users u ON u.id = cs.colaborador_id
        WHERE cs.tenant_id = $1
          AND cs.created_at > NOW() - INTERVAL '1 hour'
          AND cs.sentimento IN ('muito_negativo', 'negativo')
        ORDER BY cs.created_at DESC
      `;

      const result = await query(mudancasQuery, [tenantId]);
      const mudancas = result.rows.filter(row => 
        row.sentimento_anterior && 
        row.sentimento_anterior !== row.sentimento &&
        (row.sentimento === 'negativo' || row.sentimento === 'muito_negativo')
      );

      // Criar alertas para mudanças críticas
      for (const mudanca of mudancas) {
        await this.criarAlertaCritico({
          id: mudanca.colaborador_id,
          name: mudanca.name,
          score: 75,
          principais_fatores: ['Mudança crítica de sentimento'],
          department: 'N/A'
        }, tenantId);
      }

      return mudancas;

    } catch (error) {
      console.error('❌ Erro ao detectar mudanças de sentimento:', error);
      return [];
    }
  }

  /**
   * Determina tipo de alerta baseado no colaborador
   */
  getTipoAlerta(colaborador) {
    if (colaborador.score >= 90) return 'alerta_risco_evasao';
    if (colaborador.trilhas_atrasadas > 2) return 'alerta_trilha_atrasada';
    if (colaborador.sentimento_atual === 'muito_negativo') return 'alerta_sentimento_negativo';
    return 'alerta_baixo_engajamento';
  }

  /**
   * Converte sentimento para score numérico
   */
  getSentimentoScore(sentimento) {
    const scores = {
      'muito_positivo': 90,
      'positivo': 70,
      'neutro': 50,
      'negativo': 30,
      'muito_negativo': 10
    };
    return scores[sentimento] || 50;
  }

  /**
   * Gera relatório executivo
   */
  async gerarRelatorioExecutivo(tenantId, periodo = 30) {
    try {
      console.log('📋 Gerando relatório executivo...');
      
      const analise = await this.analisarPerformanceColaboradores(tenantId, null, periodo);
      
      const relatorio = {
        periodo: periodo,
        resumo_executivo: {
          total_colaboradores: analise.total_colaboradores,
          taxa_conclusao: analise.metricas.taxa_conclusao_trilhas,
          sentimento_medio: analise.metricas.sentimento_medio,
          colaboradores_risco: analise.colaboradores_risco
        },
        insights_principais: analise.insights.insights,
        recomendacoes: analise.insights.recomendacoes,
        colaboradores_destaque: analise.colaboradores_detalhados.slice(0, 5),
        timestamp: new Date().toISOString()
      };

      return relatorio;

    } catch (error) {
      console.error('❌ Erro ao gerar relatório executivo:', error);
      throw error;
    }
  }
}

module.exports = new ProactiveEngine();
