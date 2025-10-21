// ============================================
// ROUTE: Dashboard Metrics
// Arquivo: src/routes/dashboard.js
// Descrição: Endpoints para métricas do dashboard unificado
// ============================================

const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Configuração do banco
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// ============================================
// GET /api/dashboard/metrics/:tenantId
// Buscar métricas principais do dashboard
// ============================================
router.get('/metrics/:tenantId', async (req, res) => {
    try {
        const { tenantId } = req.params;
        
        console.log('📊 Buscando métricas do dashboard para tenant:', tenantId);
        
        // Usar a função otimizada do banco
        const query = 'SELECT get_dashboard_data($1) as data';
        const result = await pool.query(query, [tenantId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Tenant não encontrado',
                message: 'Não foi possível encontrar dados para este tenant'
            });
        }
        
        const dashboardData = result.rows[0].data;
        
        console.log('✅ Métricas carregadas com sucesso:', {
            trilhasAtivas: dashboardData.trilhasAtivas,
            usuariosOnboarding: dashboardData.usuariosOnboarding,
            alertasAtivos: dashboardData.alertasAtivos
        });
        
        res.json(dashboardData);
        
    } catch (error) {
        console.error('❌ Erro ao buscar métricas do dashboard:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            message: 'Não foi possível carregar as métricas do dashboard'
        });
    }
});

// ============================================
// GET /api/dashboard/insights/:tenantId
// Buscar insights detalhados
// ============================================
router.get('/insights/:tenantId', async (req, res) => {
    try {
        const { tenantId } = req.params;
        const { type = 'all', limit = 10, offset = 0 } = req.query;
        
        console.log('🔍 Buscando insights para tenant:', tenantId, 'tipo:', type);
        
        let query = '';
        let params = [tenantId];
        
        switch (type) {
            case 'alertas':
                query = `
                    SELECT 
                        aa.id,
                        aa.titulo,
                        aa.anotacao,
                        aa.severidade,
                        aa.status,
                        aa.proactive_score,
                        aa.created_at,
                        u.name as colaborador_nome
                    FROM agente_anotacoes aa
                    LEFT JOIN users u ON aa.colaborador_id = u.id
                    WHERE aa.tenant_id = $1 
                        AND aa.alerta_gerado = true
                        AND aa.status = 'ativo'
                    ORDER BY aa.created_at DESC
                    LIMIT $2 OFFSET $3
                `;
                params = [tenantId, limit, offset];
                break;
                
            case 'acoes':
                query = `
                    SELECT 
                        oi.id,
                        oi.titulo,
                        oi.descricao,
                        oi.status,
                        oi.tipo_acao,
                        oi.justificativa_ia,
                        oi.created_at,
                        u.name as colaborador_nome
                    FROM onboarding_improvements oi
                    LEFT JOIN users u ON oi.alvo_colaborador_id = u.id
                    WHERE oi.tenant_id = $1 
                        AND oi.status IN ('pendente_aprovacao', 'aprovada_pendente_execucao')
                    ORDER BY oi.created_at DESC
                    LIMIT $2 OFFSET $3
                `;
                params = [tenantId, limit, offset];
                break;
                
            case 'risco':
                query = `
                    SELECT 
                        u.id,
                        u.name,
                        u.email,
                        u.risk_score,
                        u.risk_score_atualizado_em,
                        u.ultima_atividade_em
                    FROM users u
                    WHERE u.tenant_id = $1 
                        AND u.active = true
                        AND u.risk_score > 50
                    ORDER BY u.risk_score DESC
                    LIMIT $2 OFFSET $3
                `;
                params = [tenantId, limit, offset];
                break;
                
            default: // 'all' ou 'padroes'
                query = `
                    SELECT 
                        aa.id,
                        aa.titulo,
                        aa.anotacao,
                        aa.tipo,
                        aa.sentimento,
                        aa.severidade,
                        aa.created_at,
                        u.name as colaborador_nome
                    FROM agente_anotacoes aa
                    LEFT JOIN users u ON aa.colaborador_id = u.id
                    WHERE aa.tenant_id = $1 
                        AND aa.tipo = 'padrao_identificado'
                    ORDER BY aa.created_at DESC
                    LIMIT $2 OFFSET $3
                `;
                params = [tenantId, limit, offset];
        }
        
        const result = await pool.query(query, params);
        
        console.log(`✅ Insights carregados (${type}):`, result.rows.length, 'registros');
        
        res.json({
            data: result.rows,
            type: type,
            count: result.rows.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
    } catch (error) {
        console.error('❌ Erro ao buscar insights:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            message: 'Não foi possível carregar os insights'
        });
    }
});

// ============================================
// POST /api/dashboard/action/:actionId
// Executar ação (aprovar/rejeitar/resolver)
// ============================================
router.post('/action/:actionId', async (req, res) => {
    try {
        const { actionId } = req.params;
        const { action, userId } = req.body; // action: 'approve', 'reject', 'resolve'
        
        console.log('⚡ Executando ação:', action, 'para ação:', actionId);
        
        let query = '';
        let params = [];
        
        switch (action) {
            case 'approve':
                query = `
                    UPDATE onboarding_improvements 
                    SET status = 'aprovada_pendente_execucao',
                        executado_em = NOW()
                    WHERE id = $1 AND tenant_id = $2
                    RETURNING *
                `;
                params = [actionId, '5978f911-738b-4aae-802a-f037fdac2e64']; // Tenant demo
                break;
                
            case 'reject':
                query = `
                    UPDATE onboarding_improvements 
                    SET status = 'rejeitada'
                    WHERE id = $1 AND tenant_id = $2
                    RETURNING *
                `;
                params = [actionId, '5978f911-738b-4aae-802a-f037fdac2e64'];
                break;
                
            case 'resolve':
                query = `
                    UPDATE agente_anotacoes 
                    SET status = 'resolvido',
                        resolvido_em = NOW(),
                        resolvido_por = $3
                    WHERE id = $1 AND tenant_id = $2
                    RETURNING *
                `;
                params = [actionId, '5978f911-738b-4aae-802a-f037fdac2e64', userId];
                break;
                
            default:
                return res.status(400).json({ 
                    error: 'Ação inválida',
                    message: 'Ação deve ser: approve, reject ou resolve'
                });
        }
        
        const result = await pool.query(query, params);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Registro não encontrado',
                message: 'Não foi possível encontrar o registro para executar a ação'
            });
        }
        
        console.log('✅ Ação executada com sucesso:', action);
        
        res.json({
            success: true,
            action: action,
            data: result.rows[0],
            message: `Ação ${action} executada com sucesso`
        });
        
    } catch (error) {
        console.error('❌ Erro ao executar ação:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            message: 'Não foi possível executar a ação'
        });
    }
});

// ============================================
// GET /api/dashboard/notifications/:userId
// Buscar notificações do usuário
// ============================================
router.get('/notifications/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 10, unread_only = false } = req.query;
        
        console.log('🔔 Buscando notificações para usuário:', userId);
        
        let query = `
            SELECT 
                n.id,
                n.tipo,
                n.titulo,
                n.mensagem,
                n.dados,
                n.link,
                n.lida,
                n.lida_em,
                n.created_at
            FROM notifications n
            WHERE n.user_id = $1
        `;
        
        const params = [userId];
        
        if (unread_only === 'true') {
            query += ' AND n.lida = false';
        }
        
        query += ' ORDER BY n.created_at DESC LIMIT $2';
        params.push(limit);
        
        const result = await pool.query(query, params);
        
        console.log('✅ Notificações carregadas:', result.rows.length, 'registros');
        
        res.json({
            notifications: result.rows,
            count: result.rows.length,
            unread_count: result.rows.filter(n => !n.lida).length
        });
        
    } catch (error) {
        console.error('❌ Erro ao buscar notificações:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            message: 'Não foi possível carregar as notificações'
        });
    }
});

// ============================================
// POST /api/dashboard/notifications/:notificationId/read
// Marcar notificação como lida
// ============================================
router.post('/notifications/:notificationId/read', async (req, res) => {
    try {
        const { notificationId } = req.params;
        const { userId } = req.body;
        
        console.log('👁️ Marcando notificação como lida:', notificationId);
        
        const query = `
            UPDATE notifications 
            SET lida = true, lida_em = NOW()
            WHERE id = $1 AND user_id = $2
            RETURNING *
        `;
        
        const result = await pool.query(query, [notificationId, userId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Notificação não encontrada',
                message: 'Não foi possível encontrar a notificação'
            });
        }
        
        console.log('✅ Notificação marcada como lida');
        
        res.json({
            success: true,
            notification: result.rows[0],
            message: 'Notificação marcada como lida'
        });
        
    } catch (error) {
        console.error('❌ Erro ao marcar notificação como lida:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            message: 'Não foi possível marcar a notificação como lida'
        });
    }
});

module.exports = router;
