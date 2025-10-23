// ============================================
// SCRIPT: Executar Migração Dashboard Mock Data
// Arquivo: run-dashboard-migration.js
// Descrição: Executa a migração SQL para inserir dados mock
// ============================================

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuração do banco
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
    try {
        console.log('🚀 Iniciando migração de dados mock para dashboard...');
        
        // Ler o arquivo SQL
        const sqlFile = path.join(__dirname, 'migrations', '016_dashboard_mock_data.sql');
        const sqlContent = fs.readFileSync(sqlFile, 'utf8');
        
        console.log('📄 Arquivo SQL carregado:', sqlFile);
        console.log('📊 Tamanho do arquivo:', sqlContent.length, 'caracteres');
        
        // Executar a migração
        console.log('⚡ Executando migração SQL...');
        await pool.query(sqlContent);
        
        console.log('✅ Migração executada com sucesso!');
        
        // Verificar se os dados foram inseridos
        console.log('🔍 Verificando dados inseridos...');
        
        const checks = [
            { name: 'Alertas proativos', query: "SELECT COUNT(*) FROM agente_anotacoes WHERE tenant_id = '5978f911-738b-4aae-802a-f037fdac2e64' AND alerta_gerado = true" },
            { name: 'Melhorias/ações', query: "SELECT COUNT(*) FROM onboarding_improvements WHERE tenant_id = '5978f911-738b-4aae-802a-f037fdac2e64'" },
            { name: 'Notificações', query: "SELECT COUNT(*) FROM notifications WHERE tenant_id = '5978f911-738b-4aae-802a-f037fdac2e64'" },
            { name: 'Usuários com risco', query: "SELECT COUNT(*) FROM users WHERE tenant_id = '5978f911-738b-4aae-802a-f037fdac2e64' AND risk_score > 0" }
        ];
        
        for (const check of checks) {
            const result = await pool.query(check.query);
            console.log(`📊 ${check.name}: ${result.rows[0].count} registros`);
        }
        
        // Testar a função de dashboard
        console.log('🧪 Testando função get_dashboard_data...');
        const dashboardTest = await pool.query("SELECT get_dashboard_data('5978f911-738b-4aae-802a-f037fdac2e64') as data");
        
        if (dashboardTest.rows.length > 0) {
            const data = dashboardTest.rows[0].data;
            console.log('✅ Função de dashboard funcionando!');
            console.log('📈 Métricas principais:', {
                trilhasAtivas: data.trilhasAtivas,
                usuariosOnboarding: data.usuariosOnboarding,
                alertasAtivos: data.alertasAtivos,
                colaboradoresRisco: data.colaboradoresRisco
            });
        }
        
        console.log('🎉 Migração concluída com sucesso!');
        console.log('📊 Dashboard pronto para uso com dados mock otimizados');
        
    } catch (error) {
        console.error('❌ Erro durante a migração:', error);
        console.error('📋 Detalhes do erro:', error.message);
        
        if (error.code) {
            console.error('🔢 Código do erro:', error.code);
        }
        
        if (error.detail) {
            console.error('📝 Detalhes adicionais:', error.detail);
        }
        
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    runMigration();
}

module.exports = { runMigration };









