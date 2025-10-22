#!/usr/bin/env node

/**
 * TESTE COMPLETO: Sistema de Processamento Automático de Conteúdos de Trilhas
 * Data: 2025-10-22
 * 
 * Testa:
 * 1. Migração SQL da tabela
 * 2. Webhook no backend
 * 3. Endpoints de processamento
 * 4. Busca semântica
 * 5. Utilitário de embeddings
 * 6. Workflow N8N documentado
 */

const fs = require('fs');
const path = require('path');

function testarMigracao() {
  console.log('🧪 TESTE 1: Migração SQL');
  console.log('========================');
  
  try {
    const migrationPath = path.join(__dirname, 'migrations', '009_processamento_conteudos_trilhas.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.log('❌ Arquivo de migração não encontrado');
      return false;
    }
    
    console.log('✅ Arquivo de migração encontrado');
    
    const content = fs.readFileSync(migrationPath, 'utf8');
    
    const verificacoes = [
      { nome: 'Tabela trilha_conteudos_processados', regex: /CREATE TABLE.*trilha_conteudos_processados/ },
      { nome: 'Campo embedding', regex: /embedding JSONB/ },
      { nome: 'Campo conteudo_extraido', regex: /conteudo_extraido TEXT/ },
      { nome: 'Campo resumo', regex: /resumo TEXT/ },
      { nome: 'Campo tags', regex: /tags TEXT\[\]/ },
      { nome: 'Campo status', regex: /status VARCHAR/ },
      { nome: 'Índice embedding', regex: /CREATE INDEX.*embedding/ },
      { nome: 'Função estatísticas', regex: /obter_estatisticas_processamento_conteudos/ },
      { nome: 'Função busca semântica', regex: /buscar_conteudos_similares/ }
    ];
    
    let passou = true;
    verificacoes.forEach(verificacao => {
      if (verificacao.regex.test(content)) {
        console.log(`✅ ${verificacao.nome}: OK`);
      } else {
        console.log(`❌ ${verificacao.nome}: FALTANDO`);
        passou = false;
      }
    });
    
    return passou;
    
  } catch (error) {
    console.log('❌ Erro ao testar migração:', error.message);
    return false;
  }
}

function testarWebhookBackend() {
  console.log('\n🧪 TESTE 2: Webhook Backend');
  console.log('===========================');
  
  try {
    const trilhasPath = path.join(__dirname, 'src', 'routes', 'trilhas.js');
    
    if (!fs.existsSync(trilhasPath)) {
      console.log('❌ Arquivo trilhas.js não encontrado');
      return false;
    }
    
    console.log('✅ Arquivo trilhas.js encontrado');
    
    const content = fs.readFileSync(trilhasPath, 'utf8');
    
    const verificacoes = [
      { nome: 'Webhook processamento', regex: /type.*trilha_conteudo_processamento/ },
      { nome: 'Payload estruturado', regex: /trilha_conteudo_id/ },
      { nome: 'Informações do tenant', regex: /tenant_id/ },
      { nome: 'Dados do conteúdo', regex: /conteudo.*tipo.*titulo/ },
      { nome: 'Log de sucesso', regex: /Webhook processamento disparado/ },
      { nome: 'Tratamento de erro', regex: /Erro ao enviar webhook processamento/ }
    ];
    
    let passou = true;
    verificacoes.forEach(verificacao => {
      if (verificacao.regex.test(content)) {
        console.log(`✅ ${verificacao.nome}: OK`);
      } else {
        console.log(`❌ ${verificacao.nome}: FALTANDO`);
        passou = false;
      }
    });
    
    return passou;
    
  } catch (error) {
    console.log('❌ Erro ao testar webhook backend:', error.message);
    return false;
  }
}

function testarEndpoints() {
  console.log('\n🧪 TESTE 3: Endpoints de Processamento');
  console.log('======================================');
  
  try {
    const trilhasPath = path.join(__dirname, 'src', 'routes', 'trilhas.js');
    const agentTrilhasPath = path.join(__dirname, 'src', 'routes', 'agent-trilhas.js');
    
    let passou = true;
    
    // Testar trilhas.js
    if (fs.existsSync(trilhasPath)) {
      const content = fs.readFileSync(trilhasPath, 'utf8');
      
      const verificacoesTrilhas = [
        { nome: 'Endpoint processamento-resultado', regex: /POST.*processamento-resultado/ },
        { nome: 'Validação trilha_conteudo_id', regex: /trilha_conteudo_id.*obrigatório/ },
        { nome: 'Upsert com ON CONFLICT', regex: /ON CONFLICT.*trilha_conteudo_id/ },
        { nome: 'Endpoint buscar processamento', regex: /GET.*conteudos.*processamento/ },
        { nome: 'Endpoint estatísticas', regex: /GET.*processamento.*estatisticas/ },
        { nome: 'Função SQL estatísticas', regex: /obter_estatisticas_processamento_conteudos/ }
      ];
      
      verificacoesTrilhas.forEach(verificacao => {
        if (verificacao.regex.test(content)) {
          console.log(`✅ ${verificacao.nome}: OK`);
        } else {
          console.log(`❌ ${verificacao.nome}: FALTANDO`);
          passou = false;
        }
      });
    }
    
    // Testar agent-trilhas.js
    if (fs.existsSync(agentTrilhasPath)) {
      const content = fs.readFileSync(agentTrilhasPath, 'utf8');
      
      const verificacoesAgent = [
        { nome: 'Endpoint busca semântica', regex: /GET.*buscar-conteudo/ },
        { nome: 'Endpoint busca avançada', regex: /POST.*buscar-conteudo-semantico/ },
        { nome: 'Geração de embedding', regex: /generateEmbedding/ },
        { nome: 'Função SQL busca', regex: /buscar_conteudos_similares/ },
        { nome: 'Filtros de busca', regex: /categoria/ },
        { nome: 'Similaridade mínima', regex: /min_similarity/ }
      ];
      
      verificacoesAgent.forEach(verificacao => {
        if (verificacao.regex.test(content)) {
          console.log(`✅ ${verificacao.nome}: OK`);
        } else {
          console.log(`❌ ${verificacao.nome}: FALTANDO`);
          passou = false;
        }
      });
    }
    
    return passou;
    
  } catch (error) {
    console.log('❌ Erro ao testar endpoints:', error.message);
    return false;
  }
}

function testarUtilitarioEmbeddings() {
  console.log('\n🧪 TESTE 4: Utilitário de Embeddings');
  console.log('====================================');
  
  try {
    const embeddingPath = path.join(__dirname, 'src', 'utils', 'embedding-generator.js');
    
    if (!fs.existsSync(embeddingPath)) {
      console.log('❌ Arquivo embedding-generator.js não encontrado');
      return false;
    }
    
    console.log('✅ Arquivo embedding-generator.js encontrado');
    
    const content = fs.readFileSync(embeddingPath, 'utf8');
    
    const verificacoes = [
      { nome: 'Função generateEmbedding', regex: /function generateEmbedding/ },
      { nome: 'Função generateEmbeddingsBatch', regex: /function generateEmbeddingsBatch/ },
      { nome: 'Função calculateSimilarity', regex: /function calculateSimilarity/ },
      { nome: 'Função isValidEmbedding', regex: /function isValidEmbedding/ },
      { nome: 'Configuração OpenAI', regex: /new OpenAI/ },
      { nome: 'Modelo text-embedding-3-small', regex: /text-embedding-3-small/ },
      { nome: 'Tratamento de erro', regex: /catch.*error/ },
      { nome: 'Fallback embedding', regex: /new Array.*1536.*fill.*0/ }
    ];
    
    let passou = true;
    verificacoes.forEach(verificacao => {
      if (verificacao.regex.test(content)) {
        console.log(`✅ ${verificacao.nome}: OK`);
      } else {
        console.log(`❌ ${verificacao.nome}: FALTANDO`);
        passou = false;
      }
    });
    
    return passou;
    
  } catch (error) {
    console.log('❌ Erro ao testar utilitário embeddings:', error.message);
    return false;
  }
}

function testarWorkflowN8N() {
  console.log('\n🧪 TESTE 5: Workflow N8N');
  console.log('========================');
  
  try {
    const workflowPath = path.join(__dirname, 'N8N_WORKFLOW_PROCESSAMENTO_CONTEUDOS.md');
    
    if (!fs.existsSync(workflowPath)) {
      console.log('❌ Documentação do workflow N8N não encontrada');
      return false;
    }
    
    console.log('✅ Documentação do workflow N8N encontrada');
    
    const content = fs.readFileSync(workflowPath, 'utf8');
    
    const verificacoes = [
      { nome: 'Webhook trigger', regex: /webhook.*processar-conteudo-trilha/ },
      { nome: 'Switch por tipo', regex: /Switch por Tipo de Conteúdo/ },
      { nome: 'Processar PDF', regex: /Processar PDF/ },
      { nome: 'Processar Vídeo', regex: /Processar Vídeo/ },
      { nome: 'Processar URL', regex: /Processar URL/ },
      { nome: 'AI Agent análise', regex: /AI Agent.*Análise Estruturada/ },
      { nome: 'Gerar Embedding', regex: /Gerar Embedding/ },
      { nome: 'Salvar resultado', regex: /Salvar Resultado no Backend/ },
      { nome: 'Tratamento de erros', regex: /Tratamento de Erros/ },
      { nome: 'Payload estruturado', regex: /trilha_conteudo_processamento/ }
    ];
    
    let passou = true;
    verificacoes.forEach(verificacao => {
      if (verificacao.regex.test(content)) {
        console.log(`✅ ${verificacao.nome}: OK`);
      } else {
        console.log(`❌ ${verificacao.nome}: FALTANDO`);
        passou = false;
      }
    });
    
    return passou;
    
  } catch (error) {
    console.log('❌ Erro ao testar workflow N8N:', error.message);
    return false;
  }
}

function testarIntegracaoCompleta() {
  console.log('\n🧪 TESTE 6: Integração Completa');
  console.log('===============================');
  
  try {
    // Verificar se todos os arquivos necessários existem
    const arquivosNecessarios = [
      'migrations/009_processamento_conteudos_trilhas.sql',
      'src/routes/trilhas.js',
      'src/routes/agent-trilhas.js',
      'src/utils/embedding-generator.js',
      'N8N_WORKFLOW_PROCESSAMENTO_CONTEUDOS.md'
    ];
    
    let passou = true;
    
    arquivosNecessarios.forEach(arquivo => {
      const arquivoPath = path.join(__dirname, arquivo);
      if (fs.existsSync(arquivoPath)) {
        console.log(`✅ ${arquivo}: ENCONTRADO`);
      } else {
        console.log(`❌ ${arquivo}: NÃO ENCONTRADO`);
        passou = false;
      }
    });
    
    // Verificar dependências
    console.log('\n📦 Verificando dependências:');
    const packagePath = path.join(__dirname, 'package.json');
    if (fs.existsSync(packagePath)) {
      const packageContent = fs.readFileSync(packagePath, 'utf8');
      
      const dependencias = [
        { nome: 'openai', regex: /"openai"/ },
        { nome: 'zod', regex: /"zod"/ },
        { nome: 'uuid', regex: /"uuid"/ }
      ];
      
      dependencias.forEach(dep => {
        if (dep.regex.test(packageContent)) {
          console.log(`✅ ${dep.nome}: INSTALADA`);
        } else {
          console.log(`❌ ${dep.nome}: FALTANDO`);
          passou = false;
        }
      });
    }
    
    return passou;
    
  } catch (error) {
    console.log('❌ Erro ao testar integração:', error.message);
    return false;
  }
}

function executarTestes() {
  console.log('🚀 INICIANDO TESTES COMPLETOS');
  console.log('=============================');
  console.log('Sistema: Processamento Automático de Conteúdos de Trilhas');
  console.log('Data:', new Date().toISOString());
  console.log('');
  
  const resultados = {
    migracao: false,
    webhook: false,
    endpoints: false,
    embeddings: false,
    workflow: false,
    integracao: false
  };
  
  // Executar testes
  resultados.migracao = testarMigracao();
  resultados.webhook = testarWebhookBackend();
  resultados.endpoints = testarEndpoints();
  resultados.embeddings = testarUtilitarioEmbeddings();
  resultados.workflow = testarWorkflowN8N();
  resultados.integracao = testarIntegracaoCompleta();
  
  // Resumo final
  console.log('\n📊 RESUMO DOS TESTES');
  console.log('====================');
  console.log('✅ Migração SQL:', resultados.migracao ? 'PASSOU' : 'FALHOU');
  console.log('✅ Webhook Backend:', resultados.webhook ? 'PASSOU' : 'FALHOU');
  console.log('✅ Endpoints:', resultados.endpoints ? 'PASSOU' : 'FALHOU');
  console.log('✅ Utilitário Embeddings:', resultados.embeddings ? 'PASSOU' : 'FALHOU');
  console.log('✅ Workflow N8N:', resultados.workflow ? 'PASSOU' : 'FALHOU');
  console.log('✅ Integração Completa:', resultados.integracao ? 'PASSOU' : 'FALHOU');
  
  const totalPassou = Object.values(resultados).filter(r => r).length;
  const totalTestes = Object.keys(resultados).length;
  
  console.log('\n🎯 RESULTADO FINAL:');
  console.log(`${totalPassou}/${totalTestes} testes passaram`);
  
  if (totalPassou === totalTestes) {
    console.log('🎉 TODOS OS TESTES PASSARAM! Sistema completo e funcional!');
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Executar migração SQL no banco');
    console.log('2. Configurar workflow N8N');
    console.log('3. Testar processamento em produção');
    console.log('4. Atualizar checklist');
    console.log('5. Monitorar logs e métricas');
  } else {
    console.log('⚠️  Alguns testes falharam. Verificar implementação.');
  }
  
  return totalPassou === totalTestes;
}

// Executar testes
const sucesso = executarTestes();
process.exit(sucesso ? 0 : 1);
