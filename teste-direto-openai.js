/**
 * Teste direto do OpenAI Sentiment Service
 */

require('dotenv').config();
const openaiSentimentService = require('./src/services/openaiSentimentService');

async function testarDireto() {
  console.log('\n🧪 TESTE DIRETO DO OPENAI SENTIMENT SERVICE\n');
  console.log('='.repeat(60));
  
  const message = "ADOREI! Estou muito feliz e empolgado com o onboarding! Sensacional! 😍🎉👏";
  const context = "Dia 1 do onboarding";
  
  console.log(`\n📝 Mensagem: "${message}"`);
  console.log(`📋 Contexto: "${context}"\n`);
  
  console.log('🔍 Verificando configuração...\n');
  
  if (openaiSentimentService.isConfigured()) {
    console.log('✅ OpenAI está configurado!\n');
  } else {
    console.log('❌ OpenAI NÃO está configurado!\n');
    process.exit(1);
  }
  
  console.log('🤖 Analisando sentimento com OpenAI...\n');
  
  try {
    const result = await openaiSentimentService.analyzeSentiment(message, context);
    
    console.log('✅ RESULTADO:\n');
    console.log(JSON.stringify(result, null, 2));
    
    console.log('\n' + '='.repeat(60));
    
    if (result.fatores_detectados.indicadores.includes('análise_simples')) {
      console.log('\n⚠️  USANDO FALLBACK (não deveria!)');
    } else {
      console.log('\n🎉 USANDO OPENAI COM IA!');
    }
    
    console.log('');
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error(error);
  }
}

testarDireto()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Erro fatal:', err);
    process.exit(1);
  });

