const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TENANT_ID = '5978f911-738b-4aae-802a-f037fdac2e64';
const USER_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

// Cores para o console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(emoji, message, color = colors.reset) {
  console.log(`${color}${emoji} ${message}${colors.reset}`);
}

async function testarEndpoints() {
  console.log('\n' + '='.repeat(60));
  log('🧪', 'TESTE COMPLETO - ENDPOINTS DE SENTIMENTOS', colors.blue);
  console.log('='.repeat(60) + '\n');

  let testesPassaram = 0;
  let testesTotal = 0;
  let sentimentoId = null;

  // ===================================================
  // TESTE 1: POST /api/sentimentos - Registrar sentimento
  // ===================================================
  testesTotal++;
  log('📝', 'TESTE 1: POST /api/sentimentos - Registrar sentimento', colors.yellow);
  
  try {
    const sentimentoData = {
      colaborador_id: USER_ID,
      sentimento: 'muito_positivo',
      intensidade: 0.95,
      origem: 'chat',
      mensagem_analisada: 'Adorei o sistema! Muito fácil de usar!',
      fatores_detectados: {
        palavras_chave: ['adorei', 'fácil'],
        tom: 'empolgado',
        indicadores: ['exclamação']
      },
      momento_onboarding: 'primeira_semana',
      dia_onboarding: 3,
      acao_agente: 'analise_sentimento',
      resposta_adaptada: 'Que ótimo! Fico feliz que esteja gostando! 🎉'
    };

    const response = await axios.post(`${BASE_URL}/api/sentimentos`, sentimentoData);
    
    if (response.status === 201 && response.data.success) {
      sentimentoId = response.data.sentimento.id;
      log('✅', `Sentimento registrado com sucesso! ID: ${sentimentoId}`, colors.green);
      log('  ', `Sentimento: ${response.data.sentimento.sentimento}`, colors.gray);
      log('  ', `Intensidade: ${response.data.sentimento.intensidade}`, colors.gray);
      testesPassaram++;
    } else {
      throw new Error('Resposta inesperada');
    }
  } catch (error) {
    log('❌', `ERRO: ${error.response?.data?.error || error.message}`, colors.red);
    if (error.response?.data) {
      console.log(colors.gray, JSON.stringify(error.response.data, null, 2), colors.reset);
    }
  }

  console.log('');

  // ===================================================
  // TESTE 2: POST /api/sentimentos - Sentimento inválido
  // ===================================================
  testesTotal++;
  log('📝', 'TESTE 2: POST /api/sentimentos - Validação (sentimento inválido)', colors.yellow);
  
  try {
    const sentimentoInvalido = {
      colaborador_id: USER_ID,
      sentimento: 'super_feliz', // inválido
      intensidade: 0.9,
      origem: 'chat'
    };

    await axios.post(`${BASE_URL}/api/sentimentos`, sentimentoInvalido);
    log('❌', 'Deveria ter retornado erro 400', colors.red);
  } catch (error) {
    if (error.response?.status === 400) {
      log('✅', 'Validação funcionou corretamente (erro 400)', colors.green);
      log('  ', `Mensagem: ${error.response.data.error}`, colors.gray);
      testesPassaram++;
    } else {
      log('❌', 'Erro inesperado', colors.red);
    }
  }

  console.log('');

  // ===================================================
  // TESTE 3: GET /api/sentimentos/colaborador/:userId - Histórico
  // ===================================================
  testesTotal++;
  log('📝', 'TESTE 3: GET /api/sentimentos/colaborador/:userId - Histórico', colors.yellow);
  
  try {
    const response = await axios.get(`${BASE_URL}/api/sentimentos/colaborador/${USER_ID}`);
    
    if (response.status === 200 && Array.isArray(response.data)) {
      log('✅', `Histórico recuperado! ${response.data.length} registros`, colors.green);
      
      if (response.data.length > 0) {
        const ultimo = response.data[0];
        log('  ', `Último sentimento: ${ultimo.sentimento} (${ultimo.intensidade})`, colors.gray);
        log('  ', `Mensagem: ${ultimo.mensagem_analisada?.substring(0, 50)}...`, colors.gray);
      }
      testesPassaram++;
    } else {
      throw new Error('Resposta inesperada');
    }
  } catch (error) {
    log('❌', `ERRO: ${error.response?.data?.error || error.message}`, colors.red);
  }

  console.log('');

  // ===================================================
  // TESTE 4: GET /api/sentimentos/colaborador/:userId/atual - Atual
  // ===================================================
  testesTotal++;
  log('📝', 'TESTE 4: GET /api/sentimentos/colaborador/:userId/atual - Sentimento atual', colors.yellow);
  
  try {
    const response = await axios.get(`${BASE_URL}/api/sentimentos/colaborador/${USER_ID}/atual`);
    
    if (response.status === 200 && response.data.sentimento_atual) {
      log('✅', 'Sentimento atual recuperado!', colors.green);
      log('  ', `Sentimento: ${response.data.sentimento_atual}`, colors.gray);
      log('  ', `Atualizado em: ${response.data.sentimento_atualizado_em}`, colors.gray);
      testesPassaram++;
    } else {
      throw new Error('Resposta inesperada');
    }
  } catch (error) {
    log('❌', `ERRO: ${error.response?.data?.error || error.message}`, colors.red);
  }

  console.log('');

  // ===================================================
  // TESTE 5: GET /api/sentimentos/estatisticas/:tenantId
  // ===================================================
  testesTotal++;
  log('📝', 'TESTE 5: GET /api/sentimentos/estatisticas/:tenantId - Estatísticas', colors.yellow);
  
  try {
    const response = await axios.get(`${BASE_URL}/api/sentimentos/estatisticas/${TENANT_ID}?dias=30`);
    
    if (response.status === 200 && response.data.distribuicao) {
      log('✅', 'Estatísticas recuperadas!', colors.green);
      log('  ', `Sentimento médio: ${response.data.sentimento_medio}`, colors.gray);
      log('  ', `Período: ${response.data.periodo_dias} dias`, colors.gray);
      log('  ', `Distribuição:`, colors.gray);
      
      response.data.distribuicao.forEach(d => {
        log('  ', `  - ${d.sentimento}: ${d.total} registros (média: ${parseFloat(d.intensidade_media).toFixed(2)})`, colors.gray);
      });
      
      testesPassaram++;
    } else {
      throw new Error('Resposta inesperada');
    }
  } catch (error) {
    log('❌', `ERRO: ${error.response?.data?.error || error.message}`, colors.red);
  }

  console.log('');

  // ===================================================
  // TESTE 6: GET /api/sentimentos/alertas/:tenantId
  // ===================================================
  testesTotal++;
  log('📝', 'TESTE 6: GET /api/sentimentos/alertas/:tenantId - Alertas', colors.yellow);
  
  try {
    const response = await axios.get(`${BASE_URL}/api/sentimentos/alertas/${TENANT_ID}`);
    
    if (response.status === 200 && Array.isArray(response.data)) {
      log('✅', `Alertas recuperados! ${response.data.length} colaboradores com sentimento negativo`, colors.green);
      
      if (response.data.length > 0) {
        response.data.forEach(alerta => {
          log('  ', `⚠️  ${alerta.name} - ${alerta.sentimento_atual}`, colors.gray);
        });
      } else {
        log('  ', '✨ Nenhum alerta! Todos os colaboradores estão bem!', colors.gray);
      }
      
      testesPassaram++;
    } else {
      throw new Error('Resposta inesperada');
    }
  } catch (error) {
    log('❌', `ERRO: ${error.response?.data?.error || error.message}`, colors.red);
  }

  console.log('');

  // ===================================================
  // RESUMO FINAL
  // ===================================================
  console.log('\n' + '='.repeat(60));
  log('📊', 'RESUMO DOS TESTES', colors.blue);
  console.log('='.repeat(60));
  
  const porcentagem = ((testesPassaram / testesTotal) * 100).toFixed(1);
  const cor = porcentagem === '100.0' ? colors.green : porcentagem >= '80.0' ? colors.yellow : colors.red;
  
  log('  ', `Testes passaram: ${testesPassaram}/${testesTotal} (${porcentagem}%)`, cor);
  
  if (testesPassaram === testesTotal) {
    log('🎉', 'TODOS OS ENDPOINTS ESTÃO FUNCIONANDO PERFEITAMENTE!', colors.green);
  } else {
    log('⚠️ ', 'Alguns testes falharam. Verifique os erros acima.', colors.yellow);
  }
  
  console.log('='.repeat(60) + '\n');
}

// Executar testes
testarEndpoints().catch(error => {
  console.error('\n💥 Erro fatal ao executar testes:', error.message);
  process.exit(1);
});

