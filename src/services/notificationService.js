// src/services/notificationService.js
/**
 * SERVIÇO DE NOTIFICAÇÕES IN-APP
 * Fase 5: Agente Proativo Autônomo
 * 
 * Gerencia notificações in-app para administradores
 */

const { query } = require('../db-pg');

class NotificationService {
  constructor() {
    this.notificationTypes = {
      'alerta_critico': {
        icon: '🚨',
        color: '#ef4444',
        priority: 'high'
      },
      'acao_pendente': {
        icon: '⏳',
        color: '#f59e0b',
        priority: 'medium'
      },
      'colaborador_risco': {
        icon: '⚠️',
        color: '#f97316',
        priority: 'high'
      },
      'melhoria_sugerida': {
        icon: '💡',
        color: '#3b82f6',
        priority: 'low'
      },
      'relatorio_diario': {
        icon: '📊',
        color: '#10b981',
        priority: 'low'
      },
      'sistema_proativo': {
        icon: '🎯',
        color: '#8b5cf6',
        priority: 'low'
      }
    };
    
    console.log('🔔 NotificationService inicializado');
  }

  /**
   * Cria uma nova notificação
   * @param {string} userId - ID do usuário que receberá a notificação
   * @param {string} tipo - Tipo da notificação
   * @param {string} titulo - Título da notificação
   * @param {string} mensagem - Mensagem da notificação
   * @param {Object} dados - Dados adicionais (opcional)
   * @param {string} link - Link para ação relacionada (opcional)
   * @returns {string} ID da notificação criada
   */
  async criarNotificacao(userId, tipo, titulo, mensagem, dados = null, link = null) {
    try {
      // Buscar tenant_id do usuário
      const userQuery = `
        SELECT tenant_id 
        FROM users 
        WHERE id = $1
      `;
      
      const userResult = await query(userQuery, [userId]);
      
      if (userResult.rows.length === 0) {
        throw new Error('Usuário não encontrado');
      }
      
      const tenantId = userResult.rows[0].tenant_id;

      const insertQuery = `
        INSERT INTO notifications (
          tenant_id,
          user_id,
          tipo,
          titulo,
          mensagem,
          dados,
          link
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7
        )
        RETURNING id
      `;

      const result = await query(insertQuery, [
        tenantId,
        userId,
        tipo,
        titulo,
        mensagem,
        dados ? JSON.stringify(dados) : null,
        link
      ]);

      const notificationId = result.rows[0].id;
      
      console.log(`🔔 Notificação criada: ${notificationId} (${tipo}) para usuário ${userId}`);
      
      return notificationId;

    } catch (error) {
      console.error('❌ Erro ao criar notificação:', error);
      throw error;
    }
  }

  /**
   * Marca uma notificação como lida
   * @param {string} notificationId - ID da notificação
   * @param {string} userId - ID do usuário (para segurança)
   * @returns {boolean} Sucesso da operação
   */
  async marcarComoLida(notificationId, userId) {
    try {
      const updateQuery = `
        UPDATE notifications 
        SET lida = true,
            lida_em = NOW()
        WHERE id = $1 
          AND user_id = $2
          AND lida = false
        RETURNING id
      `;

      const result = await query(updateQuery, [notificationId, userId]);
      
      if (result.rows.length > 0) {
        console.log(`✅ Notificação marcada como lida: ${notificationId}`);
        return true;
      }
      
      return false;

    } catch (error) {
      console.error('❌ Erro ao marcar notificação como lida:', error);
      return false;
    }
  }

  /**
   * Marca todas as notificações de um usuário como lidas
   * @param {string} userId - ID do usuário
   * @returns {number} Número de notificações marcadas como lidas
   */
  async marcarTodasComoLidas(userId) {
    try {
      const updateQuery = `
        UPDATE notifications 
        SET lida = true,
            lida_em = NOW()
        WHERE user_id = $1 
          AND lida = false
        RETURNING id
      `;

      const result = await query(updateQuery, [userId]);
      const count = result.rows.length;
      
      console.log(`✅ ${count} notificações marcadas como lidas para usuário ${userId}`);
      
      return count;

    } catch (error) {
      console.error('❌ Erro ao marcar todas as notificações como lidas:', error);
      return 0;
    }
  }

  /**
   * Busca notificações não lidas de um usuário
   * @param {string} userId - ID do usuário
   * @param {number} limit - Limite de resultados (padrão: 20)
   * @returns {Array} Lista de notificações não lidas
   */
  async buscarNaoLidas(userId, limit = 20) {
    try {
      const query = `
        SELECT 
          id,
          tipo,
          titulo,
          mensagem,
          dados,
          link,
          created_at
        FROM notifications
        WHERE user_id = $1 
          AND lida = false
        ORDER BY created_at DESC
        LIMIT $2
      `;

      const result = await query(query, [userId, limit]);
      
      // Adicionar informações de tipo
      const notificacoes = result.rows.map(notif => ({
        ...notif,
        dados: notif.dados ? JSON.parse(notif.dados) : null,
        tipo_info: this.notificationTypes[notif.tipo] || {
          icon: '📢',
          color: '#6b7280',
          priority: 'low'
        }
      }));

      return notificacoes;

    } catch (error) {
      console.error('❌ Erro ao buscar notificações não lidas:', error);
      return [];
    }
  }

  /**
   * Busca todas as notificações de um usuário (lidas e não lidas)
   * @param {string} userId - ID do usuário
   * @param {Object} options - Opções de busca
   * @returns {Array} Lista de notificações
   */
  async buscarTodas(userId, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        tipo = null,
        apenasNaoLidas = false
      } = options;

      let whereClause = 'WHERE user_id = $1';
      const params = [userId];
      let paramIndex = 2;

      if (apenasNaoLidas) {
        whereClause += ' AND lida = false';
      }

      if (tipo) {
        whereClause += ` AND tipo = $${paramIndex}`;
        params.push(tipo);
        paramIndex++;
      }

      const query = `
        SELECT 
          id,
          tipo,
          titulo,
          mensagem,
          dados,
          link,
          lida,
          lida_em,
          created_at
        FROM notifications
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);

      const result = await query(query, params);
      
      // Adicionar informações de tipo
      const notificacoes = result.rows.map(notif => ({
        ...notif,
        dados: notif.dados ? JSON.parse(notif.dados) : null,
        tipo_info: this.notificationTypes[notif.tipo] || {
          icon: '📢',
          color: '#6b7280',
          priority: 'low'
        }
      }));

      return notificacoes;

    } catch (error) {
      console.error('❌ Erro ao buscar todas as notificações:', error);
      return [];
    }
  }

  /**
   * Conta notificações não lidas de um usuário
   * @param {string} userId - ID do usuário
   * @returns {number} Número de notificações não lidas
   */
  async contarNaoLidas(userId) {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM notifications
        WHERE user_id = $1 
          AND lida = false
      `;

      const result = await query(query, [userId]);
      return parseInt(result.rows[0].count);

    } catch (error) {
      console.error('❌ Erro ao contar notificações não lidas:', error);
      return 0;
    }
  }

  /**
   * Remove notificações antigas (mais de 30 dias)
   * @param {string} userId - ID do usuário (opcional, se não informado remove de todos)
   * @returns {number} Número de notificações removidas
   */
  async limparAntigas(userId = null) {
    try {
      let whereClause = 'WHERE created_at < NOW() - INTERVAL \'30 days\'';
      const params = [];

      if (userId) {
        whereClause += ' AND user_id = $1';
        params.push(userId);
      }

      const deleteQuery = `
        DELETE FROM notifications
        ${whereClause}
        RETURNING id
      `;

      const result = await query(deleteQuery, params);
      const count = result.rows.length;
      
      console.log(`🗑️ ${count} notificações antigas removidas`);
      
      return count;

    } catch (error) {
      console.error('❌ Erro ao limpar notificações antigas:', error);
      return 0;
    }
  }

  /**
   * Notifica todos os administradores de um tenant
   * @param {string} tenantId - ID do tenant
   * @param {string} tipo - Tipo da notificação
   * @param {string} titulo - Título da notificação
   * @param {string} mensagem - Mensagem da notificação
   * @param {Object} dados - Dados adicionais (opcional)
   * @param {string} link - Link para ação relacionada (opcional)
   * @returns {number} Número de administradores notificados
   */
  async notificarAdmins(tenantId, tipo, titulo, mensagem, dados = null, link = null) {
    try {
      // Buscar todos os administradores do tenant
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

      // Criar notificação para cada admin
      for (const admin of admins) {
        try {
          await this.criarNotificacao(
            admin.id,
            tipo,
            titulo,
            mensagem,
            dados,
            link
          );
          notificados++;
        } catch (error) {
          console.error(`❌ Erro ao notificar admin ${admin.name}:`, error);
        }
      }

      console.log(`📧 ${notificados} administradores notificados no tenant ${tenantId}`);
      
      return notificados;

    } catch (error) {
      console.error('❌ Erro ao notificar administradores:', error);
      return 0;
    }
  }

  /**
   * Cria notificação de alerta crítico
   * @param {string} userId - ID do usuário
   * @param {Object} alerta - Dados do alerta
   * @returns {string} ID da notificação criada
   */
  async criarAlertaCritico(userId, alerta) {
    const titulo = `🚨 ${alerta.titulo}`;
    const mensagem = `Alerta crítico detectado: ${alerta.descricao}`;
    
    const dados = {
      alerta_id: alerta.id,
      colaborador_id: alerta.colaborador_id,
      severidade: alerta.severidade,
      score: alerta.score,
      tipo: 'alerta_critico'
    };

    return await this.criarNotificacao(
      userId,
      'alerta_critico',
      titulo,
      mensagem,
      dados,
      '/dashboard.html#proatividade-section'
    );
  }

  /**
   * Cria notificação de ação pendente
   * @param {string} userId - ID do usuário
   * @param {Object} acao - Dados da ação
   * @returns {string} ID da notificação criada
   */
  async criarAcaoPendente(userId, acao) {
    const titulo = `⏳ Ação Pendente: ${acao.titulo}`;
    const mensagem = `Nova ação sugerida pela IA aguarda sua aprovação.`;
    
    const dados = {
      acao_id: acao.id,
      colaborador_id: acao.alvo_colaborador_id,
      prioridade: acao.prioridade,
      tipo_acao: acao.tipo_acao,
      tipo: 'acao_pendente'
    };

    return await this.criarNotificacao(
      userId,
      'acao_pendente',
      titulo,
      mensagem,
      dados,
      '/dashboard.html#proatividade-section'
    );
  }

  /**
   * Cria notificação de colaborador em risco
   * @param {string} userId - ID do usuário
   * @param {Object} colaborador - Dados do colaborador
   * @returns {string} ID da notificação criada
   */
  async criarColaboradorRisco(userId, colaborador) {
    const titulo = `⚠️ Colaborador em Risco: ${colaborador.name}`;
    const mensagem = `Colaborador com score de risco ${colaborador.score}. Fatores: ${colaborador.principais_fatores.join(', ')}`;
    
    const dados = {
      colaborador_id: colaborador.id,
      colaborador_nome: colaborador.name,
      score: colaborador.score,
      nivel_risco: colaborador.nivel_risco,
      fatores: colaborador.fatores,
      tipo: 'colaborador_risco'
    };

    return await this.criarNotificacao(
      userId,
      'colaborador_risco',
      titulo,
      mensagem,
      dados,
      '/dashboard.html#proatividade-section'
    );
  }

  /**
   * Cria notificação de melhoria sugerida
   * @param {string} userId - ID do usuário
   * @param {Object} melhoria - Dados da melhoria
   * @returns {string} ID da notificação criada
   */
  async criarMelhoriaSugerida(userId, melhoria) {
    const titulo = `💡 Melhoria Sugerida: ${melhoria.titulo}`;
    const mensagem = `Nova melhoria sugerida pela IA para o processo de onboarding.`;
    
    const dados = {
      melhoria_id: melhoria.id,
      categoria: melhoria.categoria,
      prioridade: melhoria.prioridade,
      tipo: 'melhoria_sugerida'
    };

    return await this.criarNotificacao(
      userId,
      'melhoria_sugerida',
      titulo,
      mensagem,
      dados,
      '/dashboard.html#melhorias-section'
    );
  }

  /**
   * Cria notificação de relatório diário
   * @param {string} userId - ID do usuário
   * @param {Object} relatorio - Dados do relatório
   * @returns {string} ID da notificação criada
   */
  async criarRelatorioDiario(userId, relatorio) {
    const titulo = `📊 Relatório Diário Disponível`;
    const mensagem = `Relatório executivo do dia ${new Date().toLocaleDateString('pt-BR')} está disponível.`;
    
    const dados = {
      relatorio_id: relatorio.id,
      periodo: relatorio.periodo,
      metricas: relatorio.metricas,
      tipo: 'relatorio_diario'
    };

    return await this.criarNotificacao(
      userId,
      'relatorio_diario',
      titulo,
      mensagem,
      dados,
      '/dashboard.html#relatorios-section'
    );
  }

  /**
   * Retorna estatísticas de notificações
   * @param {string} userId - ID do usuário
   * @returns {Object} Estatísticas
   */
  async getStats(userId) {
    try {
      const statsQuery = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN lida = false THEN 1 END) as nao_lidas,
          COUNT(CASE WHEN lida = true THEN 1 END) as lidas,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as ultimas_24h,
          COUNT(CASE WHEN tipo = 'alerta_critico' AND lida = false THEN 1 END) as alertas_criticos,
          COUNT(CASE WHEN tipo = 'acao_pendente' AND lida = false THEN 1 END) as acoes_pendentes
        FROM notifications
        WHERE user_id = $1
      `;

      const result = await query(statsQuery, [userId]);
      const stats = result.rows[0];

      return {
        total: parseInt(stats.total),
        nao_lidas: parseInt(stats.nao_lidas),
        lidas: parseInt(stats.lidas),
        ultimas_24h: parseInt(stats.ultimas_24h),
        alertas_criticos: parseInt(stats.alertas_criticos),
        acoes_pendentes: parseInt(stats.acoes_pendentes)
      };

    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas de notificações:', error);
      return {
        total: 0,
        nao_lidas: 0,
        lidas: 0,
        ultimas_24h: 0,
        alertas_criticos: 0,
        acoes_pendentes: 0
      };
    }
  }
}

module.exports = new NotificationService();











