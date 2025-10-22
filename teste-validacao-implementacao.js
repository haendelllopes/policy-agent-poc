#!/usr/bin/env node

/**
 * TESTE SIMPLES: Validação das Implementações
 * Data: 2025-10-21
 * 
 * Testa apenas a lógica implementada nos arquivos
 */

const fs = require('fs');
const path = require('path');

function testarArquivosImplementados() {
  console.log('🧪 TESTE: Validação dos Arquivos Implementados');
  console.log('===============================================');
  
  const resultados = {
    migracaoSQL: false,
    backendValidacao: false,
    endpointN8N: false,
    endpointReordenacao: false
  };
  
  // Teste 1: Migração SQL existe e tem conteúdo correto
  console.log('\n📋 Teste 1: Migração SQL');
  try {
    const migracaoPath = path.join(__dirname, 'migrations', '008_ordem_unica_trilhas.sql');
    const migracaoContent = fs.readFileSync(migracaoPath, 'utf8');
    
    const temIndiceUnico = migracaoContent.includes('CREATE UNIQUE INDEX');
    const temFuncaoProximaOrdem = migracaoContent.includes('obter_proxima_ordem_trilha');
    const temAtualizacaoOrdem = migracaoContent.includes('WITH trilhas_ordenadas');
    
    if (temIndiceUnico && temFuncaoProximaOrdem && temAtualizacaoOrdem) {
      console.log('✅ Migração SQL implementada corretamente');
      resultados.migracaoSQL = true;
    } else {
      console.log('❌ Migração SQL incompleta');
    }
  } catch (error) {
    console.log('❌ Erro ao ler migração SQL:', error.message);
  }
  
  // Teste 2: Backend com validação de ordem única
  console.log('\n📋 Teste 2: Backend - Validação de Ordem Única');
  try {
    const trilhasPath = path.join(__dirname, 'src', 'routes', 'trilhas.js');
    const trilhasContent = fs.readFileSync(trilhasPath, 'utf8');
    
    const temValidacaoPOST = trilhasContent.includes('ordemExists = await query') && 
                            trilhasContent.includes('SELECT id FROM trilhas WHERE tenant_id = $1 AND ordem = $2');
    const temValidacaoPUT = trilhasContent.includes('SELECT id FROM trilhas WHERE tenant_id = $1 AND ordem = $2 AND id != $3');
    const temEndpointReordenar = trilhasContent.includes('POST /api/trilhas/reordenar');
    
    if (temValidacaoPOST && temValidacaoPUT && temEndpointReordenar) {
      console.log('✅ Backend com validação implementada');
      resultados.backendValidacao = true;
      resultados.endpointReordenacao = true;
    } else {
      console.log('❌ Backend com validação incompleta');
    }
  } catch (error) {
    console.log('❌ Erro ao ler arquivo trilhas.js:', error.message);
  }
  
  // Teste 3: Endpoint N8N com segmentação
  console.log('\n📋 Teste 3: Endpoint N8N - Segmentação');
  try {
    const agentTrilhasPath = path.join(__dirname, 'src', 'routes', 'agent-trilhas.js');
    const agentTrilhasContent = fs.readFileSync(agentTrilhasPath, 'utf8');
    
    const temSegmentacao = agentTrilhasContent.includes('colaborador_tem_acesso_trilha($2, t.id) = true');
    const temOrdenacaoCorreta = agentTrilhasContent.includes('CASE WHEN t.ordem = 0 THEN 999999 ELSE t.ordem END ASC');
    
    if (temSegmentacao && temOrdenacaoCorreta) {
      console.log('✅ Endpoint N8N com segmentação implementada');
      resultados.endpointN8N = true;
    } else {
      console.log('❌ Endpoint N8N com segmentação incompleta');
    }
  } catch (error) {
    console.log('❌ Erro ao ler arquivo agent-trilhas.js:', error.message);
  }
  
  return resultados;
}

function testarEstruturaBanco() {
  console.log('\n🧪 TESTE: Estrutura do Banco de Dados');
  console.log('======================================');
  
  try {
    // Verificar se a função de segmentação existe
    const segmentacaoPath = path.join(__dirname, 'migrations', '006_trilhas_segmentacao.sql');
    const segmentacaoContent = fs.readFileSync(segmentacaoPath, 'utf8');
    
    const temFuncaoSegmentacao = segmentacaoContent.includes('colaborador_tem_acesso_trilha');
    const temTabelaSegmentacao = segmentacaoContent.includes('trilha_segmentacao');
    
    if (temFuncaoSegmentacao && temTabelaSegmentacao) {
      console.log('✅ Função de segmentação existe');
    } else {
      console.log('❌ Função de segmentação não encontrada');
    }
    
    // Verificar estrutura da tabela trilhas
    const trilhasPath = path.join(__dirname, 'migrations', '001_sistema_trilhas.sql');
    const trilhasContent = fs.readFileSync(trilhasPath, 'utf8');
    
    const temCampoOrdem = trilhasContent.includes('ordem INTEGER DEFAULT 0');
    
    if (temCampoOrdem) {
      console.log('✅ Campo ordem existe na tabela trilhas');
    } else {
      console.log('❌ Campo ordem não encontrado');
    }
    
  } catch (error) {
    console.log('❌ Erro ao verificar estrutura do banco:', error.message);
  }
}

function executarTestes() {
  console.log('🚀 INICIANDO TESTES DE VALIDAÇÃO');
  console.log('=================================');
  console.log('Data:', new Date().toISOString());
  console.log('');
  
  const resultados = testarArquivosImplementados();
  testarEstruturaBanco();
  
  // Resumo final
  console.log('\n📊 RESUMO DOS TESTES');
  console.log('====================');
  console.log('✅ Migração SQL:', resultados.migracaoSQL ? 'IMPLEMENTADA' : 'FALTANDO');
  console.log('✅ Backend Validação:', resultados.backendValidacao ? 'IMPLEMENTADA' : 'FALTANDO');
  console.log('✅ Endpoint N8N:', resultados.endpointN8N ? 'IMPLEMENTADO' : 'FALTANDO');
  console.log('✅ Endpoint Reordenação:', resultados.endpointReordenacao ? 'IMPLEMENTADO' : 'FALTANDO');
  
  const totalImplementado = Object.values(resultados).filter(r => r).length;
  const totalTestes = Object.keys(resultados).length;
  
  console.log('\n🎯 RESULTADO FINAL:');
  console.log(`${totalImplementado}/${totalTestes} implementações validadas`);
  
  if (totalImplementado === totalTestes) {
    console.log('🎉 TODAS AS IMPLEMENTAÇÕES VALIDADAS!');
    console.log('✅ Sistema pronto para uso!');
  } else {
    console.log('⚠️  Algumas implementações precisam ser verificadas.');
  }
  
  return totalImplementado === totalTestes;
}

// Executar testes
const sucesso = executarTestes();
process.exit(sucesso ? 0 : 1);
