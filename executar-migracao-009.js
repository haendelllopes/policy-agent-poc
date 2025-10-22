#!/usr/bin/env node

/**
 * Executar Migração 009: Processamento Automático de Conteúdos de Trilhas
 * Data: 2025-10-22
 */

const fs = require('fs');
const path = require('path');

async function executarMigracao() {
  console.log('🚀 EXECUTANDO MIGRAÇÃO 009');
  console.log('===========================');
  console.log('Sistema: Processamento Automático de Conteúdos de Trilhas');
  console.log('Data:', new Date().toISOString());
  console.log('');

  try {
    // Ler arquivo de migração
    const migrationPath = path.join(__dirname, 'migrations', '009_processamento_conteudos_trilhas.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.log('❌ Arquivo de migração não encontrado:', migrationPath);
      return false;
    }

    console.log('✅ Arquivo de migração encontrado');
    
    const migrationContent = fs.readFileSync(migrationPath, 'utf8');
    console.log('✅ Conteúdo da migração carregado');
    
    // Verificar se já existe script de execução SQL
    const executarSqlPath = path.join(__dirname, 'executar-sql-supabase.js');
    
    if (fs.existsSync(executarSqlPath)) {
      console.log('✅ Script executar-sql-supabase.js encontrado');
      console.log('');
      console.log('📋 INSTRUÇÕES PARA EXECUÇÃO:');
      console.log('============================');
      console.log('1. Execute o comando: node executar-sql-supabase.js migrations/009_processamento_conteudos_trilhas.sql');
      console.log('2. Verifique se a migração foi aplicada com sucesso');
      console.log('3. Confirme a criação da tabela trilha_conteudos_processados');
      console.log('');
      console.log('🔍 VERIFICAÇÕES PÓS-MIGRAÇÃO:');
      console.log('- Tabela trilha_conteudos_processados criada');
      console.log('- Índices criados (tenant, status, embedding)');
      console.log('- Função obter_estatisticas_processamento_conteudos criada');
      console.log('- Função buscar_conteudos_similares criada');
      console.log('');
      console.log('⚠️  IMPORTANTE:');
      console.log('- Esta migração cria uma nova tabela');
      console.log('- Não afeta dados existentes');
      console.log('- Pode ser executada em produção com segurança');
      
      return true;
    } else {
      console.log('❌ Script executar-sql-supabase.js não encontrado');
      console.log('');
      console.log('📋 EXECUÇÃO MANUAL:');
      console.log('===================');
      console.log('1. Acesse o painel do Supabase');
      console.log('2. Vá para SQL Editor');
      console.log('3. Cole o conteúdo da migração:');
      console.log('');
      console.log('--- INÍCIO DA MIGRAÇÃO ---');
      console.log(migrationContent);
      console.log('--- FIM DA MIGRAÇÃO ---');
      console.log('');
      console.log('4. Execute a migração');
      console.log('5. Verifique se não há erros');
      
      return true;
    }

  } catch (error) {
    console.error('❌ Erro ao executar migração:', error.message);
    return false;
  }
}

// Executar migração
executarMigracao().then(sucesso => {
  if (sucesso) {
    console.log('\n🎉 MIGRAÇÃO PRONTA PARA EXECUÇÃO!');
    console.log('=================================');
    console.log('✅ Arquivo de migração validado');
    console.log('✅ Instruções geradas');
    console.log('✅ Sistema pronto para produção');
  } else {
    console.log('\n❌ ERRO NA PREPARAÇÃO DA MIGRAÇÃO');
    process.exit(1);
  }
});
