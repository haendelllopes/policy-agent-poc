// src/services/monitoringService.js
/**
 * SERVIÇO DE MONITORAMENTO CONTÍNUO
 * Fase 5: Agente Proativo Autônomo
 * 
 * Executa monitoramento a cada 15min, análise horária e relatório diário
 * Coordena todos os cron jobs do sistema proativo
 */

const { query } = require('../db-pg');
const proactiveEngine = require('./proactiveEngine');
const riskDetectionService = require('./riskDetectionService');
const notificationService = require('./notificationService');

class MonitoringService {
  constructor() {
    this.stats = {
      ultima_execucao_monitoramento: null,
      ultima_execucao_analise: null,
      ultima_execucao_relatorio: null,
      total_alertas_criados: 0,
      total_colaboradores_analisados: 0
    };
    
    console.log('📊 MonitoringService inicializado');
  }

  /**
   * MONITORAMENTO CONTÍNUO (executado a cada 15 minutos)
   * Detecta mudanças críticas e cria alertas imediatos
   */
  async monitoramentoContinuo() {
    try {
      console.log('🔄 Iniciando monitoramento contínuo...');
      const startTime = Date.now();
      
      const resultados = {
        tenants_processados: 0,
        alertas_criados: 0,
        colaboradores_analisados: 0,
        notificacoes_enviadas: 0,
        erros: []
      };

      // Buscar todos os tenants ativos
      const tenantsQuery = `
        SELECT id, name 
        FROM tenants 
        WHERE active = true
        ORDER BY created_at ASC
      `;
      
      const tenantsResult = await query(tenantsQuery);
      const tenants = tenantsResult.rows;

      console.log(`📋 Processando ${tenants.length} tenants...`);

      // Processar cada tenant
      for (const tenant of tenants) {
        try {
          console.log(`🏢 Processando tenant: ${tenant.name}`);
          
          // Executar monitoramento para o tenant
          const resultadoTenant = await this.executarMonitoramentoTenant(tenant.id);
          
          resultados.tenants_processados++;
          resultados.alertas_criados += resultadoTenant.alertas_criados;
          resultados.colaboradores_analisados += resultadoTenant.colaboradores_analisados;
          resultados.notificacoes_enviadas += resultadoTenant.notificacoes_enviadas;
          
        } catch (error) {
          console.error(`❌ Erro ao processar tenant ${tenant.name}:`, error);
          resultados.erros.push({
            tenant: tenant.name,
            erro: error.message
          });
        }
      }

      // Atualizar estatísticas
      this.stats.ultima_execucao_monitoramento = new Date();
      this.stats.total_alertas_criados += resultados.alertas_criados;
      this.stats.total_colaboradores_analisados += resultados.colaboradores_analisados;

      const tempoExecucao = Date.now() - startTime;
      console.log(`✅ Monitoramento contínuo concluído em ${tempoExecucao}ms:`, resultados);

      return resultados;

    } catch (error) {
      console.error('❌ Erro no monitoramento contínuo:', error);
      throw error;
    }
  }

  /**
   * Executa monitoramento para um tenant específico
   */
  async executarMonitoramentoTenant(tenantId) {
    const resultado = {
      alertas_criados: 0,
      colaboradores_analisados: 0,
      notificacoes_enviadas: 0
    };

    try {
      // 1. Detectar colaboradores em risco crítico
      const colaboradoresRisco = await riskDetectionService.detectarColaboradoresEmRisco(tenantId, {
        scoreMinimo: 80,
        diasAnalise: 7
      });

      resultado.colaboradores_analisados = colaboradoresRisco.length;

      // 2. Criar alertas para riscos críticos
      for (const colaborador of colaboradoresRisco) {
        if (colaborador.score >= 80) {
          await this.criarAlertaAutomatico(colaborador, tenantId);
          resultado.alertas_criados++;
        }
      }

      // 3. Detectar mudanças críticas de sentimento
      const mudancasSentimento = await this.detectarMudancasSentimentoCriticas(tenantId);
      resultado.alertas_criados += mudancasSentimento.length;

      // 4. Detectar trilhas recém-atrasadas
      const trilhasAtrasadas = await this.detectarTrilhasAtrasadas(tenantId);
      resultado.alertas_criados += trilhasAtrasadas.length;

      // 5. Detectar inatividade prolongada
      const inatividade = await this.detectarInatividade(tenantId);
      resultado.alertas_criados += inatividade.length;

      return resultado;

    } catch (error) {
      console.error(`❌ Erro no monitoramento do tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * ANÁLISE HORÁRIA (executado a cada hora)
   * Análise profunda de padrões e tendências
   */
  async analiseHoraria() {
    try {
      console.log('🔄 Iniciando análise horária...');
      const startTime = Date.now();
      
      const resultados = {
        padroes_identificados: 0,
        insights_gerados: 0,
        scores_atualizados: 0,
        melhorias_sugeridas: 0,
        erros: []
      };

      // Buscar todos os tenants ativos
      const tenantsQuery = `
        SELECT id, name 
        FROM tenants 
        WHERE active = true
      `;
      
      const tenantsResult = await query(tenantsQuery);
      const tenants = tenantsResult.rows;

      // Processar cada tenant
      for (const tenant of tenants) {
        try {
          console.log(`🔍 Análise horária para tenant: ${tenant.name}`);
          
          const resultadoTenant = await this.executarAnaliseHorariaTenant(tenant.id);
          
          resultados.padroes_identificados += resultadoTenant.padroes_identificados;
          resultados.insights_gerados += resultadoTenant.insights_gerados;
          resultados.scores_atualizados += resultadoTenant.scores_atualizados;
          resultados.melhorias_sugeridas += resultadoTenant.melhorias_sugeridas;
          
        } catch (error) {
          console.error(`❌ Erro na análise horária do tenant ${tenant.name}:`, error);
          resultados.erros.push({
            tenant: tenant.name,
            erro: error.message
          });
        }
      }

      // Atualizar estatísticas
      this.stats.ultima_execucao_analise = new Date();

      const tempoExecucao = Date.now() - startTime;
      console.log(`✅ Análise horária concluída em ${tempoExecucao}ms:`, resultados);

      return resultados;

    } catch (error) {
      console.error('❌ Erro na análise horária:', error);
      throw error;
    }
  }

  /**
   * Executa análise horária para um tenant específico
   */
  async executarAnaliseHorariaTenant(tenantId) {
    const resultado = {
      padroes_identificados: 0,
      insights_gerados: 0,
      scores_atualizados: 0,
      melhorias_sugeridas: 0
    };

    try {
      // 1. Atualizar scores de risco de todos os colaboradores
      const colaboradores = await this.buscarColaboradoresAtivos(tenantId);
      
      for (const colaborador of colaboradores) {
        const riscoData = await riskDetectionService.calcularScoreRisco(colaborador, tenantId, 30);
        await riskDetectionService.atualizarScoreRisco(colaborador.id, riscoData);
        resultado.scores_atualizados++;
      }

      // 2. Identificar padrões comportamentais
      const padroes = await this.identificarPadroesComportamentais(tenantId);
      resultado.padroes_identificados = padroes.length;

      // 3. Gerar insights usando análise de performance
      const analise = await proactiveEngine.analisarPerformanceColaboradores(tenantId, null, 7);
      resultado.insights_gerados = analise.insights.insights.length;

      // 4. Sugerir melhorias baseadas nos insights
      const melhorias = await this.sugerirMelhorias(tenantId, analise);
      resultado.melhorias_sugeridas = melhorias.length;

      return resultado;

    } catch (error) {
      console.error(`❌ Erro na análise horária do tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * RELATÓRIO DIÁRIO (executado diariamente às 9h)
   * Relatório executivo e resumo do dia anterior
   */
  async relatorioDiario() {
    try {
      console.log('🔄 Iniciando relatório diário...');
      const startTime = Date.now();
      
      const resultados = {
        relatorios_gerados: 0,
        admins_notificados: 0,
        melhorias_sugeridas: 0,
        erros: []
      };

      // Buscar todos os tenants ativos
      const tenantsQuery = `
        SELECT id, name 
        FROM tenants 
        WHERE active = true
      `;
      
      const tenantsResult = await query(tenantsQuery);
      const tenants = tenantsResult.rows;

      // Processar cada tenant
      for (const tenant of tenants) {
        try {
          console.log(`📋 Relatório diário para tenant: ${tenant.name}`);
          
          const resultadoTenant = await this.executarRelatorioDiarioTenant(tenant.id);
          
          resultados.relatorios_gerados += resultadoTenant.relatorios_gerados;
          resultados.admins_notificados += resultadoTenant.admins_notificados;
          resultados.melhorias_sugeridas += resultadoTenant.melhorias_sugeridas;
          
        } catch (error) {
          console.error(`❌ Erro no relatório diário do tenant ${tenant.name}:`, error);
          resultados.erros.push({
            tenant: tenant.name,
            erro: error.message
          });
        }
      }

      // Atualizar estatísticas
      this.stats.ultima_execucao_relatorio = new Date();

      const tempoExecucao = Date.now() - startTime;
      console.log(`✅ Relatório diário concluído em ${tempoExecucao}ms:`, resultados);

      return resultados;

    } catch (error) {
      console.error('❌ Erro no relatório diário:', error);
      throw error;
    }
  }

  /**
   * Executa relatório diário para um tenant específico
   */
  async executarRelatorioDiarioTenant(tenantId) {
    const resultado = {
      relatorios_gerados: 0,
      admins_notificados: 0,
      melhorias_sugeridas: 0
    };

    try {
      // 1. Gerar relatório executivo
      const relatorio = await proactiveEngine.gerarRelatorioExecutivo(tenantId, 1);
      
      // 2. Salvar relatório no banco
      await this.salvarRelatorioDiario(tenantId, relatorio);
      resultado.relatorios_gerados++;

      // 3. Notificar administradores
      const adminsNotificados = await this.notificarAdminsRelatorio(tenantId, relatorio);
      resultado.admins_notificados = adminsNotificados;

      // 4. Sugerir melhorias prioritárias
      const melhorias = await this.sugerirMelhoriasPrioritarias(tenantId, relatorio);
      resultado.melhorias_sugeridas = melhorias.length;

      return resultado;

    } catch (error) {
      console.error(`❌ Erro no relatório diário do tenant ${tenantId}:`, error);
      throw error;
    }
  }

  // ============================================
  // MÉTODOS AUXILIARES
  // ============================================

  /**
   * Cria alerta automático para colaborador em risco
   */
  async criarAlertaAutomatico(colaborador, tenantId) {
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
        nivel_risco: colaborador.nivel_risco,
        gerado_por: 'monitoring_service',
        timestamp: new Date().toISOString()
      };

      const tags = ['risco_alto', 'alerta_automatico', colaborador.department];

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

      console.log(`🚨 Alerta automático criado: ${result.rows[0].id}`);
      return result.rows[0].id;

    } catch (error) {
      console.error('❌ Erro ao criar alerta automático:', error);
    }
  }

  /**
   * Detecta mudanças críticas de sentimento
   */
  async detectarMudancasSentimentoCriticas(tenantId) {
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
        await this.criarAlertaAutomatico({
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
   * Detecta trilhas recém-atrasadas
   */
  async detectarTrilhasAtrasadas(tenantId) {
    try {
      const trilhasQuery = `
        SELECT 
          ct.colaborador_id,
          u.name,
          t.nome as trilha_nome,
          ct.data_limite,
          ct.progresso_percentual
        FROM colaborador_trilhas ct
        JOIN users u ON u.id = ct.colaborador_id
        JOIN trilhas t ON t.id = ct.trilha_id
        WHERE ct.tenant_id = $1
          AND ct.status != 'concluida'
          AND ct.data_limite < NOW()
          AND ct.data_limite > NOW() - INTERVAL '1 hour'
        ORDER BY ct.data_limite ASC
      `;

      const result = await query(trilhasQuery, [tenantId]);
      const trilhasAtrasadas = result.rows;

      // Criar alertas para trilhas atrasadas
      for (const trilha of trilhasAtrasadas) {
        await this.criarAlertaAutomatico({
          id: trilha.colaborador_id,
          name: trilha.name,
          score: 60,
          principais_fatores: [`Trilha "${trilha.trilha_nome}" atrasada`],
          department: 'N/A'
        }, tenantId);
      }

      return trilhasAtrasadas;

    } catch (error) {
      console.error('❌ Erro ao detectar trilhas atrasadas:', error);
      return [];
    }
  }

  /**
   * Detecta inatividade prolongada
   */
  async detectarInatividade(tenantId) {
    try {
      const inatividadeQuery = `
        SELECT 
          u.id,
          u.name,
          u.ultima_atividade_em,
          MAX(ch.created_at) as ultima_interacao
        FROM users u
        LEFT JOIN conversation_history ch ON ch.user_id = u.id
        WHERE u.tenant_id = $1
          AND u.active = true
          AND (
            u.ultima_atividade_em < NOW() - INTERVAL '5 days' OR
            MAX(ch.created_at) < NOW() - INTERVAL '5 days'
          )
        GROUP BY u.id, u.name, u.ultima_atividade_em
        HAVING MAX(ch.created_at) < NOW() - INTERVAL '5 days' OR MAX(ch.created_at) IS NULL
      `;

      const result = await query(inatividadeQuery, [tenantId]);
      const colaboradoresInativos = result.rows;

      // Criar alertas para inatividade
      for (const colaborador of colaboradoresInativos) {
        await this.criarAlertaAutomatico({
          id: colaborador.id,
          name: colaborador.name,
          score: 70,
          principais_fatores: ['Inatividade prolongada'],
          department: 'N/A'
        }, tenantId);
      }

      return colaboradoresInativos;

    } catch (error) {
      console.error('❌ Erro ao detectar inatividade:', error);
      return [];
    }
  }

  /**
   * Busca colaboradores ativos do tenant
   */
  async buscarColaboradoresAtivos(tenantId) {
    try {
      const query = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.department,
          u.position,
          u.sentimento_atual,
          u.risk_score,
          u.created_at as data_admissao
        FROM users u
        WHERE u.tenant_id = $1
          AND u.active = true
        ORDER BY u.name
      `;

      const result = await query(query, [tenantId]);
      return result.rows;

    } catch (error) {
      console.error('❌ Erro ao buscar colaboradores ativos:', error);
      return [];
    }
  }

  /**
   * Identifica padrões comportamentais
   */
  async identificarPadroesComportamentais(tenantId) {
    try {
      const padroesQuery = `
        SELECT 
          tipo,
          COUNT(*) as frequencia,
          AVG(proactive_score) as score_medio,
          MAX(created_at) as ultimo_evento
        FROM agente_anotacoes
        WHERE tenant_id = $1
          AND created_at > NOW() - INTERVAL '24 hours'
        GROUP BY tipo
        HAVING COUNT(*) >= 2
        ORDER BY frequencia DESC
      `;

      const result = await query(padroesQuery, [tenantId]);
      return result.rows;

    } catch (error) {
      console.error('❌ Erro ao identificar padrões:', error);
      return [];
    }
  }

  /**
   * Sugere melhorias baseadas na análise
   */
  async sugerirMelhorias(tenantId, analise) {
    try {
      const melhorias = [];

      // Sugestão baseada na taxa de conclusão
      if (analise.metricas.taxa_conclusao_trilhas < 70) {
        melhorias.push({
          categoria: 'processo',
          prioridade: 'alta',
          titulo: 'Melhorar Taxa de Conclusão de Trilhas',
          descricao: `Taxa atual de ${analise.metricas.taxa_conclusao_trilhas}% está abaixo do ideal. Sugerir revisão do conteúdo e metodologia.`,
          contexto: analise.metricas,
          status: 'sugerida',
          criado_por: 'ai_agent'
        });
      }

      // Sugestão baseada em colaboradores em risco
      if (analise.colaboradores_risco > 0) {
        melhorias.push({
          categoria: 'suporte',
          prioridade: 'alta',
          titulo: 'Programa de Acompanhamento para Colaboradores em Risco',
          descricao: `${analise.colaboradores_risco} colaboradores em risco detectados. Implementar programa de acompanhamento próximo.`,
          contexto: { colaboradores_risco: analise.colaboradores_risco },
          status: 'sugerida',
          criado_por: 'ai_agent'
        });
      }

      // Salvar melhorias no banco
      for (const melhoria of melhorias) {
        await this.salvarMelhoria(tenantId, melhoria);
      }

      return melhorias;

    } catch (error) {
      console.error('❌ Erro ao sugerir melhorias:', error);
      return [];
    }
  }

  /**
   * Salva melhoria no banco de dados
   */
  async salvarMelhoria(tenantId, melhoria) {
    try {
      const query = `
        INSERT INTO onboarding_improvements (
          tenant_id,
          categoria,
          prioridade,
          titulo,
          descricao,
          contexto,
          status,
          criado_por
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8
        )
        RETURNING id
      `;

      const result = await query(query, [
        tenantId,
        melhoria.categoria,
        melhoria.prioridade,
        melhoria.titulo,
        melhoria.descricao,
        JSON.stringify(melhoria.contexto),
        melhoria.status,
        melhoria.criado_por
      ]);

      console.log(`💡 Melhoria salva: ${result.rows[0].id}`);
      return result.rows[0].id;

    } catch (error) {
      console.error('❌ Erro ao salvar melhoria:', error);
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
   * Salva relatório diário no banco
   */
  async salvarRelatorioDiario(tenantId, relatorio) {
    try {
      const query = `
        INSERT INTO agente_anotacoes (
          tenant_id,
          tipo,
          titulo,
          anotacao,
          contexto,
          tags
        ) VALUES (
          $1, $2, $3, $4, $5, $6
        )
        RETURNING id
      `;

      const titulo = `📊 Relatório Diário - ${new Date().toLocaleDateString('pt-BR')}`;
      const anotacao = `Relatório executivo gerado automaticamente. ${relatorio.resumo_executivo.total_colaboradores} colaboradores analisados.`;
      
      const tags = ['relatorio_diario', 'executivo', 'automatico'];

      const result = await query(query, [
        tenantId,
        'observacao_geral',
        titulo,
        anotacao,
        JSON.stringify(relatorio),
        tags
      ]);

      console.log(`📊 Relatório diário salvo: ${result.rows[0].id}`);
      return result.rows[0].id;

    } catch (error) {
      console.error('❌ Erro ao salvar relatório diário:', error);
    }
  }

  /**
   * Notifica administradores sobre relatório diário
   */
  async notificarAdminsRelatorio(tenantId, relatorio) {
    try {
      const adminsQuery = `
        SELECT id, name, email
        FROM users
        WHERE tenant_id = $1
          AND role = 'admin'
          AND active = true
      `;

      const adminsResult = await query(adminsQuery, [tenantId]);
      const admins = adminsResult.rows;

      let notificados = 0;

      for (const admin of admins) {
        await notificationService.criarNotificacao(
          admin.id,
          'relatorio_diario',
          '📊 Relatório Diário Disponível',
          `Relatório executivo do dia ${new Date().toLocaleDateString('pt-BR')} está disponível.`,
          relatorio,
          '/dashboard.html#proatividade-section'
        );
        notificados++;
      }

      console.log(`📧 ${notificados} administradores notificados`);
      return notificados;

    } catch (error) {
      console.error('❌ Erro ao notificar admins:', error);
      return 0;
    }
  }

  /**
   * Sugere melhorias prioritárias baseadas no relatório
   */
  async sugerirMelhoriasPrioritarias(tenantId, relatorio) {
    try {
      const melhorias = [];

      // Analisar insights principais
      for (const insight of relatorio.insights_principais) {
        if (insight.impacto === 'alto') {
          melhorias.push({
            categoria: 'estrategia',
            prioridade: 'alta',
            titulo: `Ação: ${insight.titulo}`,
            descricao: insight.descricao,
            contexto: { insight },
            status: 'sugerida',
            criado_por: 'ai_agent'
          });
        }
      }

      // Salvar melhorias
      for (const melhoria of melhorias) {
        await this.salvarMelhoria(tenantId, melhoria);
      }

      return melhorias;

    } catch (error) {
      console.error('❌ Erro ao sugerir melhorias prioritárias:', error);
      return [];
    }
  }

  /**
   * Retorna estatísticas do serviço
   */
  getStats() {
    return {
      ...this.stats,
      status: 'ativo',
      proxima_execucao_monitoramento: this.calcularProximaExecucao('monitoramento'),
      proxima_execucao_analise: this.calcularProximaExecucao('analise'),
      proxima_execucao_relatorio: this.calcularProximaExecucao('relatorio')
    };
  }

  /**
   * Calcula próxima execução baseada no tipo
   */
  calcularProximaExecucao(tipo) {
    const agora = new Date();
    
    switch (tipo) {
      case 'monitoramento':
        // Próxima execução em 15 minutos
        return new Date(agora.getTime() + 15 * 60 * 1000);
      case 'analise':
        // Próxima execução em 1 hora
        return new Date(agora.getTime() + 60 * 60 * 1000);
      case 'relatorio':
        // Próxima execução amanhã às 9h
        const amanha = new Date(agora);
        amanha.setDate(agora.getDate() + 1);
        amanha.setHours(9, 0, 0, 0);
        return amanha;
      default:
        return null;
    }
  }
}

module.exports = new MonitoringService();
