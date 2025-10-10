/**
 * Script de Teste de Configuração do Flowly
 * Verifica se todas as variáveis de ambiente estão funcionais
 */

const http = require('http');

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

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
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => reject(error));
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function runTests() {
  log('\n🧪 TESTE DE CONFIGURAÇÃO DO FLOWLY\n', 'cyan');
  log('═'.repeat(50), 'blue');
  
  let passedTests = 0;
  let totalTests = 0;

  // Teste 1: Health Check
  totalTests++;
  log('\n1️⃣  Testando Health Check...', 'yellow');
  try {
    const result = await makeRequest('/api/health');
    if (result.status === 200) {
      log('✅ Health Check: OK', 'green');
      log(`   📊 Ambiente: ${result.data.env || 'N/A'}`, 'cyan');
      log(`   💾 PostgreSQL: ${result.data.postgres || 'N/A'}`, 'cyan');
      log(`   🗄️  Database Status: ${result.data.database?.status || 'N/A'}`, 'cyan');
      passedTests++;
    } else {
      log(`❌ Health Check: FALHOU (${result.status})`, 'red');
    }
  } catch (error) {
    log(`❌ Health Check: ERRO - ${error.message}`, 'red');
  }

  // Teste 2: Conexão com Banco de Dados
  totalTests++;
  log('\n2️⃣  Testando Conexão com Banco de Dados...', 'yellow');
  try {
    const result = await makeRequest('/api/debug/environment');
    if (result.status === 200) {
      log('✅ Endpoint de Debug: OK', 'green');
      
      const env = result.data.environment;
      log(`   DATABASE_URL: ${env.DATABASE_URL}`, 'cyan');
      log(`   PGHOST: ${env.PGHOST}`, 'cyan');
      
      if (env.DATABASE_URL !== 'NOT_SET' || env.PGHOST !== 'NOT_SET') {
        log('   ✅ Variáveis de banco configuradas', 'green');
        passedTests++;
      } else {
        log('   ⚠️  Nenhuma variável de banco configurada', 'yellow');
      }
    } else {
      log(`❌ Endpoint de Debug: FALHOU (${result.status})`, 'red');
    }
  } catch (error) {
    log(`⚠️  Endpoint de Debug não disponível`, 'yellow');
  }

  // Teste 3: Análise de Sentimento (com fallback)
  totalTests++;
  log('\n3️⃣  Testando Análise de Sentimento...', 'yellow');
  try {
    const testData = {
      message: "Estou gostando muito do onboarding!",
      userId: "test-user-123",
      context: "Teste automático",
      tenantId: "test-tenant"
    };
    
    const result = await makeRequest('/api/analise-sentimento', 'POST', testData);
    if (result.status === 200 && result.data.success) {
      log('✅ Análise de Sentimento: OK', 'green');
      log(`   Sentimento: ${result.data.sentiment.sentimento}`, 'cyan');
      log(`   Intensidade: ${result.data.sentiment.intensidade}`, 'cyan');
      log(`   Tom: ${result.data.sentiment.fatores_detectados?.tom || 'N/A'}`, 'cyan');
      passedTests++;
    } else {
      log(`❌ Análise de Sentimento: FALHOU`, 'red');
      log(`   ${JSON.stringify(result.data)}`, 'red');
    }
  } catch (error) {
    log(`❌ Análise de Sentimento: ERRO - ${error.message}`, 'red');
  }

  // Teste 4: Verificar API Keys
  totalTests++;
  log('\n4️⃣  Verificando Configuração de APIs...', 'yellow');
  
  const apiKeys = {
    'GOOGLE_GEMINI_API_KEY': process.env.GOOGLE_GEMINI_API_KEY,
    'OPENAI_API_KEY': process.env.OPENAI_API_KEY,
    'DATABASE_URL': process.env.DATABASE_URL,
    'N8N_WEBHOOK_URL': process.env.N8N_WEBHOOK_URL
  };

  let configuredApis = 0;
  for (const [key, value] of Object.entries(apiKeys)) {
    if (value && value.length > 0) {
      log(`   ✅ ${key}: Configurada`, 'green');
      configuredApis++;
    } else {
      log(`   ⚠️  ${key}: Não configurada`, 'yellow');
    }
  }

  if (configuredApis >= 2) {
    log('   ✅ Configuração de APIs: Suficiente', 'green');
    passedTests++;
  } else {
    log('   ⚠️  Poucas APIs configuradas (mínimo recomendado: 2)', 'yellow');
  }

  // Resumo Final
  log('\n' + '═'.repeat(50), 'blue');
  log(`\n📊 RESULTADO FINAL: ${passedTests}/${totalTests} testes passaram\n`, 'cyan');
  
  if (passedTests === totalTests) {
    log('🎉 TUDO FUNCIONANDO PERFEITAMENTE!', 'green');
  } else if (passedTests >= totalTests * 0.7) {
    log('✅ Configuração OK - Alguns opcionais faltando', 'yellow');
  } else {
    log('⚠️  Verifique as configurações acima', 'yellow');
  }
  
  log('');
}

// Aguardar 3 segundos para servidor inicializar
setTimeout(() => {
  runTests().catch(err => {
    log(`\n❌ ERRO FATAL: ${err.message}`, 'red');
    log('🔍 Verifique se o servidor está rodando: npm run dev\n', 'yellow');
  });
}, 3000);

log('\n⏳ Aguardando servidor inicializar (3s)...\n', 'yellow');

