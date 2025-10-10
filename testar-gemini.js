/**
 * Testa se o Google Gemini está configurado e funcionando
 */

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testarGemini() {
  console.log('\n🤖 TESTE DO GOOGLE GEMINI\n');
  console.log('='.repeat(60));
  
  // 1. Verificar se a API key existe
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  
  console.log('\n1️⃣  Verificando API Key...\n');
  
  if (!apiKey) {
    console.log('❌ GOOGLE_GEMINI_API_KEY não está configurada no .env');
    console.log('\n💡 Configure no arquivo .env:');
    console.log('   GOOGLE_GEMINI_API_KEY=sua_chave_aqui');
    console.log('\n📍 Obtenha em: https://makersuite.google.com/app/apikey\n');
    process.exit(1);
  }
  
  console.log(`✅ API Key encontrada: ${apiKey.substring(0, 10)}...${apiKey.slice(-4)}`);
  console.log(`   Comprimento: ${apiKey.length} caracteres`);
  
  // 2. Tentar inicializar o Gemini
  console.log('\n2️⃣  Inicializando Gemini...\n');
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    console.log('✅ Gemini inicializado com sucesso');
    console.log('   Modelo: gemini-pro');
    
    // 3. Fazer uma requisição de teste
    console.log('\n3️⃣  Testando análise de sentimento...\n');
    
    const prompt = `
Analise o sentimento da seguinte mensagem:

Mensagem: "Estou adorando o onboarding! Muito empolgante e inspirador! 😊👍"

Responda APENAS em JSON válido com esta estrutura:
{
  "sentimento": "muito_positivo",
  "intensidade": 0.95,
  "fatores_detectados": {
    "palavras_chave": ["adorando", "empolgante", "inspirador"],
    "tom": "empolgado",
    "indicadores": ["emoji_positivo", "ponto_exclamacao"]
  }
}
`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Resposta recebida do Gemini:\n');
    console.log(text);
    
    // 4. Tentar parsear o JSON
    console.log('\n4️⃣  Validando resposta JSON...\n');
    
    let jsonString = text.trim();
    if (jsonString.includes('```json')) {
      jsonString = jsonString.split('```json')[1].split('```')[0];
    } else if (jsonString.includes('```')) {
      jsonString = jsonString.split('```')[1].split('```')[0];
    }
    
    const sentimentData = JSON.parse(jsonString.trim());
    
    console.log('✅ JSON válido parseado com sucesso!\n');
    console.log('📊 Resultado da análise:');
    console.log(`   Sentimento: ${sentimentData.sentimento}`);
    console.log(`   Intensidade: ${sentimentData.intensidade}`);
    console.log(`   Tom: ${sentimentData.fatores_detectados?.tom || 'N/A'}`);
    console.log(`   Palavras-chave: ${sentimentData.fatores_detectados?.palavras_chave?.join(', ') || 'N/A'}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('\n🎉 GEMINI ESTÁ FUNCIONANDO PERFEITAMENTE!\n');
    console.log('💡 O sistema usará análise inteligente com IA.\n');
    
  } catch (error) {
    console.log('\n❌ ERRO AO USAR GEMINI:\n');
    console.log(`   Mensagem: ${error.message}`);
    
    if (error.message.includes('API key')) {
      console.log('\n💡 SOLUÇÃO: Verifique se a API key está correta');
      console.log('   1. Acesse: https://makersuite.google.com/app/apikey');
      console.log('   2. Gere uma nova API key');
      console.log('   3. Atualize no .env: GOOGLE_GEMINI_API_KEY=nova_chave');
    } else if (error.message.includes('404')) {
      console.log('\n💡 SOLUÇÃO: Modelo não encontrado');
      console.log('   O modelo gemini-1.5-flash-latest pode não estar disponível');
      console.log('   Experimente: gemini-pro');
    } else {
      console.log('\n⚠️  Detalhes do erro:', error);
    }
    
    console.log('\n📋 Sistema usará FALLBACK (análise simples)');
    console.log('   Funcionará, mas com menos precisão.\n');
    
    process.exit(1);
  }
}

testarGemini()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n❌ ERRO FATAL:', err.message);
    process.exit(1);
  });

