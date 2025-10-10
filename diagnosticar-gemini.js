/**
 * Diagnóstico detalhado do erro do Gemini
 */

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function diagnosticar() {
  console.log('\n🔍 DIAGNÓSTICO DETALHADO DO GEMINI\n');
  console.log('='.repeat(60));
  
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  
  console.log(`\n🔑 API Key: ${apiKey}\n`);
  console.log(`   Tamanho: ${apiKey.length} caracteres`);
  console.log(`   Formato: ${apiKey.startsWith('AIza') ? '✅ Válido' : '❌ Inválido'}\n`);
  
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Testar com gemini-1.5-flash
  console.log('📍 Tentando: gemini-1.5-flash\n');
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('Teste');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ SUCESSO!');
    console.log(`   Resposta: ${text}\n`);
    
    return 'gemini-1.5-flash';
    
  } catch (error) {
    console.log('❌ ERRO DETALHADO:\n');
    console.log(`   Mensagem: ${error.message}\n`);
    
    if (error.response) {
      console.log(`   Status HTTP: ${error.response.status}`);
      console.log(`   Status Text: ${error.response.statusText}\n`);
    }
    
    // Verificar tipo de erro
    if (error.message.includes('404')) {
      console.log('💡 DIAGNÓSTICO: Modelo não encontrado para esta API version');
      console.log('   Possível causa: API usando v1beta, mas modelo só disponível em v1\n');
    } else if (error.message.includes('403')) {
      console.log('💡 DIAGNÓSTICO: Acesso negado');
      console.log('   Possível causa: API key sem permissões ou billing não configurado\n');
    } else if (error.message.includes('401')) {
      console.log('💡 DIAGNÓSTICO: Não autorizado');
      console.log('   Possível causa: API key inválida\n');
    } else if (error.message.includes('429')) {
      console.log('💡 DIAGNÓSTICO: Limite de requisições excedido\n');
    }
    
    console.log('🔧 VERIFICAÇÕES SUGERIDAS:\n');
    console.log('   1. Acesse: https://aistudio.google.com/app/apikey');
    console.log('   2. Verifique se a API key está ATIVA');
    console.log('   3. Verifique se "Generative Language API" está habilitada');
    console.log('   4. Confira se há billing configurado (se necessário)\n');
    
    console.log('⚠️  SOLUÇÃO TEMPORÁRIA: Sistema usará análise FALLBACK\n');
    
    return null;
  }
}

diagnosticar()
  .then(modelo => {
    if (modelo) {
      console.log('='.repeat(60));
      console.log(`\n🎉 Gemini funcionando com modelo: ${modelo}\n`);
      process.exit(0);
    } else {
      console.log('='.repeat(60));
      console.log('\n⚠️  Gemini não disponível - usando fallback\n');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('\nErro fatal:', err);
    process.exit(1);
  });

