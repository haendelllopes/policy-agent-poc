/**
 * Lista modelos disponíveis na API do Gemini
 */

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listarModelos() {
  console.log('\n📋 LISTANDO MODELOS DISPONÍVEIS NO GEMINI\n');
  console.log('='.repeat(60));
  
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.log('❌ API Key não configurada');
    process.exit(1);
  }
  
  console.log(`\n🔑 API Key: ${apiKey.substring(0, 10)}...${apiKey.slice(-4)}\n`);
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Listar modelos
    const models = await genAI.listModels();
    
    console.log(`✅ Modelos disponíveis (${models.length}):\n`);
    
    models.forEach((model, i) => {
      console.log(`${(i + 1).toString().padStart(2, ' ')}. ${model.name}`);
      console.log(`    Suporta generateContent: ${model.supportedGenerationMethods?.includes('generateContent') ? '✅' : '❌'}`);
      console.log('');
    });
    
    // Recomendar modelo
    const modeloRecomendado = models.find(m => 
      m.supportedGenerationMethods?.includes('generateContent') &&
      (m.name.includes('gemini-1.5') || m.name.includes('gemini-pro'))
    );
    
    if (modeloRecomendado) {
      const nomeModelo = modeloRecomendado.name.replace('models/', '');
      console.log('='.repeat(60));
      console.log(`\n💡 MODELO RECOMENDADO: ${nomeModelo}\n`);
      console.log('📝 Atualize no código:');
      console.log(`   model: "${nomeModelo}"\n`);
    }
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    
    if (error.message.includes('API key')) {
      console.log('\n💡 A API key pode estar inválida ou sem permissões');
      console.log('   1. Acesse: https://makersuite.google.com/app/apikey');
      console.log('   2. Verifique se a key está ativa');
      console.log('   3. Gere uma nova key se necessário\n');
    }
  }
}

listarModelos()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Erro:', err);
    process.exit(1);
  });

