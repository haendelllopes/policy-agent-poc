// ============================================
// SCRIPT: Inserir Dados Mock Diretamente
// Arquivo: insert-mock-data-direct.js
// Descrição: Insere dados mock diretamente via SQL no banco
// ============================================

const { Pool } = require('pg');

// Configuração do banco
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function insertMockData() {
    try {
        console.log('🚀 Inserindo dados mock diretamente no banco...');
        
        const tenantId = '5978f911-738b-4aae-802a-f037fdac2e64';
        const userId = '4ab6c765-bcfc-4280-84cd-3190fcf881c2';
        
        // 1. Inserir alertas proativos
        console.log('📊 Inserindo alertas proativos...');
        const alertas = [
            {
                tenant_id: tenantId,
                colaborador_id: userId,
                titulo: 'Baixo engajamento em trilha',
                anotacao: 'Colaborador demonstra baixo interesse nas trilhas de onboarding',
                tipo: 'alerta_baixo_engajamento',
                sentimento: 'negativo',
                severidade: 'critica',
                status: 'ativo',
                proactive_score: 85,
                alerta_gerado: true
            },
            {
                tenant_id: tenantId,
                colaborador_id: userId,
                titulo: 'Múltiplas dúvidas não resolvidas',
                anotacao: 'Colaborador tem várias dúvidas pendentes há mais de 3 dias',
                tipo: 'alerta_inatividade',
                sentimento: 'neutro',
                severidade: 'alta',
                status: 'ativo',
                proactive_score: 70,
                alerta_gerado: true
            },
            {
                tenant_id: tenantId,
                colaborador_id: userId,
                titulo: 'Sentimento negativo crescente',
                anotacao: 'Feedback negativo sobre processo de onboarding',
                tipo: 'alerta_sentimento_negativo',
                sentimento: 'negativo',
                severidade: 'media',
                status: 'ativo',
                proactive_score: 60,
                alerta_gerado: true
            }
        ];
        
        for (const alerta of alertas) {
            try {
                const query = `
                    INSERT INTO agente_anotacoes (
                        tenant_id, colaborador_id, titulo, anotacao, tipo, 
                        sentimento, severidade, status, proactive_score, alerta_gerado, created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
                    ON CONFLICT DO NOTHING
                `;
                
                await pool.query(query, [
                    alerta.tenant_id, alerta.colaborador_id, alerta.titulo, alerta.anotacao,
                    alerta.tipo, alerta.sentimento, alerta.severidade, alerta.status,
                    alerta.proactive_score, alerta.alerta_gerado
                ]);
                
                console.log('✅ Alerta inserido:', alerta.titulo);
            } catch (error) {
                console.log('⚠️ Erro ao inserir alerta:', alerta.titulo, error.message);
            }
        }
        
        // 2. Inserir melhorias/ações
        console.log('💡 Inserindo melhorias/ações...');
        const melhorias = [
            {
                tenant_id: tenantId,
                titulo: 'Revisar trilha de onboarding',
                descricao: 'Ajustar conteúdo da trilha de desenvolvimento',
                status: 'pendente_aprovacao',
                tipo_acao: 'ajustar_trilha',
                alvo_colaborador_id: userId,
                justificativa_ia: 'IA detectou padrão de dificuldade com documentação técnica',
                dados_acao: JSON.stringify({
                    trilha_id: 'dev-onboarding',
                    ajustes: ['adicionar_exemplos_praticos', 'simplificar_linguagem']
                })
            },
            {
                tenant_id: tenantId,
                titulo: 'Agendar reunião de feedback',
                descricao: 'Reunião individual com colaborador em risco',
                status: 'aprovada_pendente_execucao',
                tipo_acao: 'contatar_colaborador',
                alvo_colaborador_id: userId,
                justificativa_ia: 'Score de risco alto requer intervenção imediata',
                dados_acao: JSON.stringify({
                    tipo_reuniao: 'feedback',
                    urgencia: 'alta',
                    agendamento: 'proximo_dia_util'
                })
            }
        ];
        
        for (const melhoria of melhorias) {
            try {
                const query = `
                    INSERT INTO onboarding_improvements (
                        tenant_id, titulo, descricao, status, tipo_acao,
                        alvo_colaborador_id, justificativa_ia, dados_acao, created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
                    ON CONFLICT DO NOTHING
                `;
                
                await pool.query(query, [
                    melhoria.tenant_id, melhoria.titulo, melhoria.descricao, melhoria.status,
                    melhoria.tipo_acao, melhoria.alvo_colaborador_id, melhoria.justificativa_ia,
                    melhoria.dados_acao
                ]);
                
                console.log('✅ Melhoria inserida:', melhoria.titulo);
            } catch (error) {
                console.log('⚠️ Erro ao inserir melhoria:', melhoria.titulo, error.message);
            }
        }
        
        // 3. Atualizar score de risco do usuário
        console.log('👤 Atualizando score de risco do usuário...');
        try {
            const query = `
                UPDATE users 
                SET risk_score = $1, 
                    risk_score_atualizado_em = NOW(),
                    ultima_atividade_em = NOW() - INTERVAL '2 hours'
                WHERE id = $2
            `;
            
            await pool.query(query, [75, userId]);
            console.log('✅ Score de risco atualizado para usuário');
        } catch (error) {
            console.log('⚠️ Erro ao atualizar score de risco:', error.message);
        }
        
        // 4. Inserir notificações
        console.log('🔔 Inserindo notificações...');
        const notificacoes = [
            {
                tenant_id: tenantId,
                user_id: userId,
                tipo: 'alerta_critico',
                titulo: '🚨 Alerta Crítico: Baixo Engajamento',
                mensagem: 'Colaborador João Silva apresenta baixo engajamento nas trilhas',
                dados: JSON.stringify({
                    alerta_id: '1',
                    severidade: 'critica',
                    score: 85
                }),
                link: '/dashboard.html#alertas'
            },
            {
                tenant_id: tenantId,
                user_id: userId,
                tipo: 'acao_pendente',
                titulo: '⏳ Ação Pendente: Revisar Trilha',
                mensagem: 'Aprovação necessária para ajustar trilha de desenvolvimento',
                dados: JSON.stringify({
                    acao_id: '1',
                    tipo: 'ajustar_trilha'
                }),
                link: '/dashboard.html#acoes'
            }
        ];
        
        for (const notificacao of notificacoes) {
            try {
                const query = `
                    INSERT INTO notifications (
                        tenant_id, user_id, tipo, titulo, mensagem, dados, link, created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                    ON CONFLICT DO NOTHING
                `;
                
                await pool.query(query, [
                    notificacao.tenant_id, notificacao.user_id, notificacao.tipo,
                    notificacao.titulo, notificacao.mensagem, notificacao.dados, notificacao.link
                ]);
                
                console.log('✅ Notificação inserida:', notificacao.titulo);
            } catch (error) {
                console.log('⚠️ Erro ao inserir notificação:', notificacao.titulo, error.message);
            }
        }
        
        // 5. Verificar dados inseridos
        console.log('🔍 Verificando dados inseridos...');
        
        const checks = [
            { name: 'Alertas proativos', query: `SELECT COUNT(*) FROM agente_anotacoes WHERE tenant_id = $1 AND alerta_gerado = true` },
            { name: 'Melhorias/ações', query: `SELECT COUNT(*) FROM onboarding_improvements WHERE tenant_id = $1` },
            { name: 'Notificações', query: `SELECT COUNT(*) FROM notifications WHERE tenant_id = $1` },
            { name: 'Usuários com risco', query: `SELECT COUNT(*) FROM users WHERE tenant_id = $1 AND risk_score > 0` }
        ];
        
        for (const check of checks) {
            try {
                const result = await pool.query(check.query, [tenantId]);
                console.log(`📊 ${check.name}: ${result.rows[0].count} registros`);
            } catch (error) {
                console.log(`⚠️ Erro ao verificar ${check.name}:`, error.message);
            }
        }
        
        console.log('🎉 Dados mock inseridos com sucesso!');
        console.log('📊 Dashboard pronto para uso');
        
    } catch (error) {
        console.error('❌ Erro durante inserção:', error);
        console.error('📋 Detalhes do erro:', error.message);
    } finally {
        await pool.end();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    insertMockData();
}

module.exports = { insertMockData };









