// ============================================
// SCRIPT: Inserir Dados Mock via API
// Arquivo: insert-mock-data-api.js
// Descrição: Insere dados mock via endpoints da API
// ============================================

const axios = require('axios');

const BASE_URL = 'https://policy-agent-75q8a1a5r-haendelllopes-projects.vercel.app';
const TENANT_ID = '5978f911-738b-4aae-802a-f037fdac2e64';

async function insertMockData() {
    try {
        console.log('🚀 Inserindo dados mock via API...');
        
        // 1. Inserir alertas proativos
        console.log('📊 Inserindo alertas proativos...');
        const alertas = [
            {
                tenant_id: TENANT_ID,
                colaborador_id: '4ab6c765-bcfc-4280-84cd-3190fcf881c2',
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
                tenant_id: TENANT_ID,
                colaborador_id: '4ab6c765-bcfc-4280-84cd-3190fcf881c2',
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
                tenant_id: TENANT_ID,
                colaborador_id: '4ab6c765-bcfc-4280-84cd-3190fcf881c2',
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
                const response = await axios.post(`${BASE_URL}/api/agent/anotacoes`, alerta);
                console.log('✅ Alerta inserido:', alerta.titulo);
            } catch (error) {
                console.log('⚠️ Erro ao inserir alerta:', alerta.titulo, error.response?.data?.message || error.message);
            }
        }
        
        // 2. Inserir melhorias/ações
        console.log('💡 Inserindo melhorias/ações...');
        const melhorias = [
            {
                tenant_id: TENANT_ID,
                titulo: 'Revisar trilha de onboarding',
                descricao: 'Ajustar conteúdo da trilha de desenvolvimento',
                status: 'pendente_aprovacao',
                tipo_acao: 'ajustar_trilha',
                alvo_colaborador_id: '4ab6c765-bcfc-4280-84cd-3190fcf881c2',
                justificativa_ia: 'IA detectou padrão de dificuldade com documentação técnica',
                dados_acao: {
                    trilha_id: 'dev-onboarding',
                    ajustes: ['adicionar_exemplos_praticos', 'simplificar_linguagem']
                }
            },
            {
                tenant_id: TENANT_ID,
                titulo: 'Agendar reunião de feedback',
                descricao: 'Reunião individual com colaborador em risco',
                status: 'aprovada_pendente_execucao',
                tipo_acao: 'contatar_colaborador',
                alvo_colaborador_id: '4ab6c765-bcfc-4280-84cd-3190fcf881c2',
                justificativa_ia: 'Score de risco alto requer intervenção imediata',
                dados_acao: {
                    tipo_reuniao: 'feedback',
                    urgencia: 'alta',
                    agendamento: 'proximo_dia_util'
                }
            }
        ];
        
        for (const melhoria of melhorias) {
            try {
                const response = await axios.post(`${BASE_URL}/api/onboarding-improvements`, melhoria);
                console.log('✅ Melhoria inserida:', melhoria.titulo);
            } catch (error) {
                console.log('⚠️ Erro ao inserir melhoria:', melhoria.titulo, error.response?.data?.message || error.message);
            }
        }
        
        // 3. Atualizar score de risco do usuário
        console.log('👤 Atualizando score de risco do usuário...');
        try {
            const userUpdate = {
                risk_score: 75,
                risk_score_atualizado_em: new Date().toISOString(),
                ultima_atividade_em: new Date().toISOString()
            };
            
            const response = await axios.put(`${BASE_URL}/api/users/4ab6c765-bcfc-4280-84cd-3190fcf881c2`, userUpdate);
            console.log('✅ Score de risco atualizado para usuário');
        } catch (error) {
            console.log('⚠️ Erro ao atualizar score de risco:', error.response?.data?.message || error.message);
        }
        
        // 4. Testar endpoint de métricas
        console.log('🧪 Testando endpoint de métricas...');
        try {
            const response = await axios.get(`${BASE_URL}/api/dashboard/metrics/${TENANT_ID}`);
            console.log('✅ Endpoint de métricas funcionando!');
            console.log('📈 Métricas principais:', {
                trilhasAtivas: response.data.trilhasAtivas,
                usuariosOnboarding: response.data.usuariosOnboarding,
                alertasAtivos: response.data.alertasAtivos,
                colaboradoresRisco: response.data.colaboradoresRisco
            });
        } catch (error) {
            console.log('⚠️ Erro ao testar endpoint de métricas:', error.response?.data?.message || error.message);
        }
        
        console.log('🎉 Dados mock inseridos com sucesso!');
        console.log('📊 Dashboard pronto para uso');
        
    } catch (error) {
        console.error('❌ Erro durante inserção:', error);
        console.error('📋 Detalhes do erro:', error.message);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    insertMockData();
}

module.exports = { insertMockData };









