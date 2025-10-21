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
        
        // Query direta para buscar métricas
        const query = `
            SELECT 
                (SELECT COUNT(*) FROM trilhas WHERE tenant_id = $1) as trilhas_ativas,
                (SELECT COUNT(*) FROM users WHERE tenant_id = $1) as total_usuarios,
                (SELECT COUNT(*) FROM users WHERE tenant_id = $1 AND created_at > NOW() - INTERVAL '30 days') as usuarios_onboarding,
                (SELECT COUNT(*) FROM onboarding_improvements WHERE tenant_id = $1 AND status = 'sugerida') as melhorias_sugeridas,
                (SELECT COUNT(*) FROM onboarding_improvements WHERE tenant_id = $1 AND status = 'pendente_aprovacao') as acoes_pendentes,
                (SELECT AVG(CASE 
                    WHEN sentimento = 'muito_positivo' THEN 5
                    WHEN sentimento = 'positivo' THEN 4
                    WHEN sentimento = 'neutro' THEN 3
                    WHEN sentimento = 'negativo' THEN 2
                    WHEN sentimento = 'muito_negativo' THEN 1
                    ELSE 3
                END) FROM agente_anotacoes WHERE tenant_id = $1 AND created_at > NOW() - INTERVAL '7 days') as sentimento_medio,
                (SELECT COUNT(*) FROM agente_anotacoes WHERE tenant_id = $1 AND alerta_gerado = true AND status = 'ativo') as alertas_ativos,
                (SELECT COUNT(*) FROM agente_anotacoes WHERE tenant_id = $1 AND severidade = 'critica' AND status = 'ativo') as alertas_criticos,
                (SELECT COUNT(*) FROM users WHERE tenant_id = $1 AND risk_score > 70) as colaboradores_alto_risco,
                (SELECT COUNT(*) FROM users WHERE tenant_id = $1 AND risk_score > 50) as colaboradores_risco
        `;
        
        const result = await pool.query(query, [tenantId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Tenant não encontrado',
                message: 'Não foi possível encontrar dados para este tenant'
            });
        }
        
        const metrics = result.rows[0];
        
        // Construir resposta no formato esperado pelo frontend
        const dashboardData = {
            tenant_id: tenantId,
            timestamp: new Date().toISOString(),
            
            // Métricas principais
            trilhasAtivas: parseInt(metrics.trilhas_ativas) || 0,
            usuariosOnboarding: parseInt(metrics.usuarios_onboarding) || 0,
            melhoriasSugeridas: parseInt(metrics.melhorias_sugeridas) || 0,
            sentimentoMedio: parseFloat(metrics.sentimento_medio) || 0,
            alertasAtivos: parseInt(metrics.alertas_ativos) || 0,
            colaboradoresRisco: parseInt(metrics.colaboradores_alto_risco) || 0,
            
            // Tendências (mock por enquanto)
            trilhasTrend: '+12%',
            usuariosTrend: '+8%',
            melhoriasTrend: '+15%',
            sentimentoTrend: '+0.3',
            alertasTrend: '-25%',
            riscoTrend: '-50%',
            
            // Dados para gráficos (dados reais do banco)
            graficos: await getGraficosReais(tenantId, pool)
        };
        
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

// ============================================
// FUNÇÃO AUXILIAR: Buscar dados reais para gráficos
// ============================================
async function getGraficosReais(tenantId, pool) {
    try {
        // 1. Trilhas por Cargo (dados reais)
        const trilhasPorCargoQuery = `
            SELECT 
                COALESCE(p.name, 'Sem Cargo') as cargo,
                COUNT(DISTINCT ut.trilha_id) as ativas,
                COUNT(CASE WHEN ut.status = 'concluido' THEN 1 END) as concluidas,
                COUNT(CASE WHEN ut.status = 'atrasado' THEN 1 END) as atrasadas
            FROM users u
            LEFT JOIN positions p ON u.position_id = p.id
            LEFT JOIN user_trilhas ut ON u.id = ut.user_id
            WHERE u.tenant_id = $1
            GROUP BY p.name
            ORDER BY ativas DESC
        `;
        const trilhasPorCargo = await pool.query(trilhasPorCargoQuery, [tenantId]);

        // 2. Sentimento por Cargo (dados reais)
        const sentimentoPorCargoQuery = `
            SELECT 
                COALESCE(p.name, 'Sem Cargo') as cargo,
                AVG(CASE 
                    WHEN aa.sentimento = 'muito_positivo' THEN 5
                    WHEN aa.sentimento = 'positivo' THEN 4
                    WHEN aa.sentimento = 'neutro' THEN 3
                    WHEN aa.sentimento = 'negativo' THEN 2
                    WHEN aa.sentimento = 'muito_negativo' THEN 1
                    ELSE 3
                END) as sentimento_medio
            FROM users u
            LEFT JOIN positions p ON u.position_id = p.id
            LEFT JOIN agente_anotacoes aa ON u.id = aa.colaborador_id
            WHERE u.tenant_id = $1 
                AND aa.created_at > NOW() - INTERVAL '30 days'
            GROUP BY p.name
            ORDER BY sentimento_medio DESC
        `;
        const sentimentoPorCargo = await pool.query(sentimentoPorCargoQuery, [tenantId]);

        // 3. Alertas por Severidade (dados reais)
        const alertasPorSeveridadeQuery = `
            SELECT 
                COALESCE(severidade, 'sem_severidade') as severidade,
                COUNT(*) as quantidade
            FROM agente_anotacoes
            WHERE tenant_id = $1 
                AND alerta_gerado = true 
                AND status = 'ativo'
            GROUP BY severidade
            ORDER BY 
                CASE severidade 
                    WHEN 'critica' THEN 1
                    WHEN 'alta' THEN 2
                    WHEN 'media' THEN 3
                    WHEN 'baixa' THEN 4
                    ELSE 5
                END
        `;
        const alertasPorSeveridade = await pool.query(alertasPorSeveridadeQuery, [tenantId]);

        // 4. Tendência de Engajamento (últimos 7 dias)
        const tendenciaEngajamentoQuery = `
            SELECT 
                TO_CHAR(created_at, 'Dy') as dia,
                COUNT(*) as engajamento
            FROM agente_anotacoes
            WHERE tenant_id = $1 
                AND created_at > NOW() - INTERVAL '7 days'
            GROUP BY TO_CHAR(created_at, 'Dy'), TO_CHAR(created_at, 'D')
            ORDER BY TO_CHAR(created_at, 'D')
        `;
        const tendenciaEngajamento = await pool.query(tendenciaEngajamentoQuery, [tenantId]);

        // 5. Padrões Identificados (dados reais)
        const padroesIdentificadosQuery = `
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
            LIMIT 10
        `;
        const padroesIdentificados = await pool.query(padroesIdentificadosQuery, [tenantId]);

        // 6. Alertas Críticos (dados reais)
        const alertasCriticosQuery = `
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
                AND aa.severidade = 'critica' 
                AND aa.status = 'ativo'
            ORDER BY aa.created_at DESC
            LIMIT 10
        `;
        const alertasCriticos = await pool.query(alertasCriticosQuery, [tenantId]);

        // 7. Ações Pendentes (dados reais)
        const acoesPendentesQuery = `
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
                AND oi.status = 'pendente_aprovacao'
            ORDER BY oi.created_at DESC
            LIMIT 10
        `;
        const acoesPendentes = await pool.query(acoesPendentesQuery, [tenantId]);

        // 8. Colaboradores em Risco (dados reais)
        const colaboradoresRiscoQuery = `
            SELECT 
                u.id,
                u.name,
                u.email,
                u.risk_score,
                u.risk_score_atualizado_em,
                u.ultima_atividade_em,
                p.name as cargo
            FROM users u
            LEFT JOIN positions p ON u.position_id = p.id
            WHERE u.tenant_id = $1 
                AND u.risk_score > 50
            ORDER BY u.risk_score DESC
            LIMIT 10
        `;
        const colaboradoresRisco = await pool.query(colaboradoresRiscoQuery, [tenantId]);

        return {
            trilhasPorCargo: trilhasPorCargo.rows.map(row => ({
                cargo: row.cargo,
                ativas: parseInt(row.ativas) || 0,
                concluidas: parseInt(row.concluidas) || 0,
                atrasadas: parseInt(row.atrasadas) || 0
            })),
            sentimentoPorCargo: sentimentoPorCargo.rows.map(row => ({
                cargo: row.cargo,
                sentimento: parseFloat(row.sentimento_medio) || 0
            })),
            alertasPorSeveridade: alertasPorSeveridade.rows.map(row => ({
                severidade: row.severidade === 'critica' ? 'Crítico' : 
                           row.severidade === 'alta' ? 'Alto' :
                           row.severidade === 'media' ? 'Médio' : 'Baixo',
                quantidade: parseInt(row.quantidade) || 0
            })),
            tendenciaEngajamento: tendenciaEngajamento.rows.map(row => ({
                dia: row.dia,
                engajamento: parseInt(row.engajamento) || 0
            })),
            padroesIdentificados: padroesIdentificados.rows,
            alertasCriticos: alertasCriticos.rows,
            acoesPendentes: acoesPendentes.rows,
            colaboradoresRisco: colaboradoresRisco.rows
        };

    } catch (error) {
        console.error('❌ Erro ao buscar dados reais dos gráficos:', error);
        // Retornar dados mock em caso de erro
        return {
            trilhasPorCargo: [
                { cargo: 'Desenvolvedor', ativas: 0, concluidas: 0, atrasadas: 0 },
                { cargo: 'Designer', ativas: 0, concluidas: 0, atrasadas: 0 }
            ],
            sentimentoPorCargo: [
                { cargo: 'Desenvolvedor', sentimento: 0 },
                { cargo: 'Designer', sentimento: 0 }
            ],
            alertasPorSeveridade: [
                { severidade: 'Crítico', quantidade: 0 },
                { severidade: 'Alto', quantidade: 0 },
                { severidade: 'Médio', quantidade: 0 },
                { severidade: 'Baixo', quantidade: 0 }
            ],
            tendenciaEngajamento: [
                { dia: 'Seg', engajamento: 0 },
                { dia: 'Ter', engajamento: 0 },
                { dia: 'Qua', engajamento: 0 },
                { dia: 'Qui', engajamento: 0 },
                { dia: 'Sex', engajamento: 0 },
                { dia: 'Sáb', engajamento: 0 },
                { dia: 'Dom', engajamento: 0 }
            ],
            padroesIdentificados: [],
            alertasCriticos: [],
            acoesPendentes: [],
            colaboradoresRisco: []
        };
    }
}

module.exports = router;
