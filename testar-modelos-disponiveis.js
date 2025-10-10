/**
 * Testa quais modelos Gemini estão disponíveis
 */

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const MODELOS_PARA_TESTAR = [
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-pro',
  'gemini-pro-vision',
  'models/gemini-1.5-flash',
  'models/gemini-1.5-pro',
  'models/gemini-pro'
];

async function testarModelo(genAI, nomeModelo) {
  try {
    const model = genAI.getGenerativeModel({ model: nomeModelo });
    const result = await model.generateContent('Responda apenas: OK');
    await result.response;
    return { modelo: nomeModelo, funciona: true };
  } catch (error) {
    return { modelo: nomeModelo, funciona: false, erro: error.message };
  }
}

async function testarTodosModelos() {
  console.log('\n🧪 TESTANDO MODELOS GEMINI DISPONÍVEIS\n');
  console.log('='.repeat(60));
  
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.log('❌ API Key não configurada');
    process.exit(1);
  }
  
  console.log(`\n🔑 API Key: ${apiKey.substring(0, 10)}...${apiKey.slice(-4)}\n`);
  console.log(`📋 Testando ${MODELOS_PARA_TESTAR.length} modelos...\n`);
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const resultados = [];
  
  for (const modelo of MODELOS_PARA_TESTAR) {
    process.stdout.write(`   Testando ${modelo.padEnd(30, ' ')} ... `);
    
    const resultado = await testarModelo(genAI, modelo);
    resultados.push(resultado);
    
    if (resultado.funciona) {
      console.log('✅ FUNCIONA');
    } else {
      console.log('❌ Não disponível');
    }
  }
  
  // Resumo
  console.log('\n' + '='.repeat(60));
  
  const funcionando = resultados.filter(r => r.funciona);
  
  if (funcionando.length > 0) {
    console.log(`\n✅ MODELOS QUE FUNCIONAM (${funcionando.length}):\n`);
    funcionando.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.modelo}`);
    });
    
    console.log(`\n💡 RECOMENDAÇÃO: Use "${funcionando[0].modelo}"\n`);
    console.log('📝 Atualize em src/services/geminiService.js:');
    console.log(`   model: "${funcionando[0].modelo}"\n`);
    
    return funcionando[0].modelo;
  } else {
    console.log('\n❌ NENHUM MODELO FUNCIONOU!\n');
    console.log('Possíveis causas:');
    console.log('   1. API key inválida ou expirada');
    console.log('   2. API key sem permissões para Gemini');
    console.log('   3. Conta do Google sem acesso ao Gemini\n');
    console.log('💡 SOLUÇÃO:');
    console.log('   1. Acesse: https://makersuite.google.com/app/apikey');
    console.log('   2. Gere uma NOVA API key');
    console.log('   3. Atualize no .env\n');
    console.log('⚠️  O sistema continuará usando FALLBACK (análise simples)\n');
    
    return null;
  }
}

testarTodosModelos()
  .then(modeloFuncionando => {
    if (modeloFuncionando) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('\nErro:', err);
    process.exit(1);
  });

