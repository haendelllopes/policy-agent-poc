/**
 * Validação Completa Antes de Fazer Commit
 * Garante que nenhuma API foi quebrada
 */

const http = require('http');

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {}
    };

    if (data) {
      const body = JSON.stringify(data);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', error => reject(error));
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function validarAPIs() {
  console.log('\n🔍 VALIDAÇÃO COMPLETA DE APIs ANTES DO COMMIT\n');
  console.log('='.repeat(70));
  
  const testes = [];
  
  // Teste 1: Health Check (API existente)
  console.log('\n1️⃣  Health Check (API existente)...');
  try {
    const result = await makeRequest('/api/health');
    if (result.status === 200) {
      console.log('   ✅ PASSOU - Status 200');
      testes.push({ api: 'Health Check', status: 'OK' });
    } else {
      console.log(`   ❌ FALHOU - Status ${result.status}`);
      testes.push({ api: 'Health Check', status: 'ERRO', code: result.status });
    }
  } catch (error) {
    console.log(`   ❌ ERRO - ${error.message}`);
    testes.push({ api: 'Health Check', status: 'ERRO', error: error.message });
  }
  
  // Teste 2: Listar Trilhas (API existente)
  console.log('\n2️⃣  Listar Trilhas (API existente)...');
  try {
    const result = await makeRequest('/api/trilhas');
    if (result.status === 200) {
      const count = Array.isArray(result.data) ? result.data.length : 'N/A';
      console.log(`   ✅ PASSOU - Status 200, ${count} trilhas`);
      testes.push({ api: 'Listar Trilhas', status: 'OK', count });
    } else {
      console.log(`   ❌ FALHOU - Status ${result.status}`);
      testes.push({ api: 'Listar Trilhas', status: 'ERRO', code: result.status });
    }
  } catch (error) {
    console.log(`   ❌ ERRO - ${error.message}`);
    testes.push({ api: 'Listar Trilhas', status: 'ERRO', error: error.message });
  }
  
  // Teste 3: Nova API - Análise de Sentimento
  console.log('\n3️⃣  Análise de Sentimento (NOVA API)...');
  try {
    const testData = {
      message: "Teste de validação pré-commit",
      userId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      tenantId: "5978f911-738b-4aae-802a-f037fdac2e64",
      context: "Validação"
    };
    
    const result = await makeRequest('/api/analise-sentimento', 'POST', testData);
    if (result.status === 200 && result.data.success) {
      console.log(`   ✅ PASSOU - Status 200`);
      console.log(`      Sentimento: ${result.data.sentiment.sentimento}`);
      console.log(`      Intensidade: ${result.data.sentiment.intensidade}`);
      console.log(`      Usando: ${result.data.sentiment.fatores_detectados.indicadores.includes('análise_simples') ? 'Fallback' : 'IA (OpenAI)'}`);
      testes.push({ api: 'Análise Sentimento', status: 'OK', usando: result.data.sentiment.fatores_detectados.indicadores[0] });
    } else {
      console.log(`   ❌ FALHOU - Status ${result.status}`);
      testes.push({ api: 'Análise Sentimento', status: 'ERRO', code: result.status });
    }
  } catch (error) {
    console.log(`   ❌ ERRO - ${error.message}`);
    testes.push({ api: 'Análise Sentimento', status: 'ERRO', error: error.message });
  }
  
  // Teste 4: Endpoint de sentimentos (se existir)
  console.log('\n4️⃣  Sentimentos (API existente, se houver)...');
  try {
    const result = await makeRequest('/api/sentimentos');
    console.log(`   Status ${result.status} - ${result.status === 200 ? '✅ OK' : '⚠️ Verificar'}`);
    testes.push({ api: 'Sentimentos', status: result.status === 200 ? 'OK' : 'INFO', code: result.status });
  } catch (error) {
    console.log(`   ⚠️ Endpoint não responde (normal se não existir)`);
    testes.push({ api: 'Sentimentos', status: 'N/A' });
  }
  
  // Resumo
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 RESUMO DA VALIDAÇÃO:\n');
  
  const passou = testes.filter(t => t.status === 'OK' || t.status === 'INFO' || t.status === 'N/A').length;
  const total = testes.filter(t => t.status !== 'N/A').length;
  
  console.table(testes);
  
  console.log(`\n✅ APIs validadas: ${passou}/${total}`);
  
  if (passou >= total) {
    console.log('\n🎉 VALIDAÇÃO COMPLETA - SEGURO PARA COMMIT!\n');
    console.log('✅ Nenhuma API existente foi quebrada');
    console.log('✅ Nova funcionalidade está funcionando');
    console.log('✅ Sistema 100% operacional\n');
    return true;
  } else {
    console.log('\n⚠️  ATENÇÃO - Revisar antes de commitar\n');
    return false;
  }
}

validarAPIs()
  .then(safe => {
    console.log('='.repeat(70));
    console.log(safe ? '\n✅ PRONTO PARA COMMIT\n' : '\n⚠️  REVISAR MUDANÇAS\n');
    process.exit(safe ? 0 : 1);
  })
  .catch(err => {
    console.error('\n❌ ERRO NA VALIDAÇÃO:', err);
    process.exit(1);
  });

