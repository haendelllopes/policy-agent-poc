/**
 * Testa a API key da OpenAI
 */

require('dotenv').config();
const OpenAI = require('openai');

async function testarOpenAI() {
  console.log('\n🤖 TESTE DA OPENAI API\n');
  console.log('='.repeat(60));
  
  const apiKey = process.env.OPENAI_API_KEY;
  
  console.log('\n1️⃣  Verificando API Key...\n');
  
  if (!apiKey) {
    console.log('❌ OPENAI_API_KEY não está configurada no .env\n');
    console.log('💡 Para configurar:');
    console.log('   1. Acesse: https://platform.openai.com/api-keys');
    console.log('   2. Crie uma nova API key');
    console.log('   3. Adicione no .env: OPENAI_API_KEY=sua_chave_aqui\n');
    process.exit(1);
  }
  
  console.log(`✅ API Key encontrada: ${apiKey.substring(0, 10)}...${apiKey.slice(-4)}`);
  console.log(`   Comprimento: ${apiKey.length} caracteres`);
  
  console.log('\n2️⃣  Inicializando OpenAI...\n');
  
  try {
    const openai = new OpenAI({ apiKey });
    console.log('✅ OpenAI inicializada com sucesso');
    
    console.log('\n3️⃣  Testando análise de sentimento...\n');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Você é um assistente que analisa sentimento. Responda apenas com JSON."
        },
        {
          role: "user",
          content: `Analise o sentimento: "Estou adorando o onboarding! Muito empolgante! 😊"

Responda em JSON:
{
  "sentimento": "muito_positivo",
  "intensidade": 0.9,
  "tom": "empolgado"
}`
        }
      ],
      temperature: 0.3,
      max_tokens: 200
    });

    const response = completion.choices[0].message.content;
    
    console.log('✅ Resposta recebida da OpenAI:\n');
    console.log(response);
    
    console.log('\n4️⃣  Validando resposta JSON...\n');
    
    let jsonString = response.trim();
    if (jsonString.includes('```json')) {
      jsonString = jsonString.split('```json')[1].split('```')[0];
    } else if (jsonString.includes('```')) {
      jsonString = jsonString.split('```')[1].split('```')[0];
    }
    
    const data = JSON.parse(jsonString.trim());
    
    console.log('✅ JSON válido parseado com sucesso!\n');
    console.log('📊 Resultado:');
    console.log(`   Sentimento: ${data.sentimento}`);
    console.log(`   Intensidade: ${data.intensidade}`);
    console.log(`   Tom: ${data.tom}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('\n🎉 OPENAI ESTÁ FUNCIONANDO PERFEITAMENTE!\n');
    console.log('💡 O sistema usará análise inteligente com OpenAI.\n');
    
    return true;
    
  } catch (error) {
    console.log('\n❌ ERRO AO USAR OPENAI:\n');
    console.log(`   Mensagem: ${error.message}\n`);
    
    if (error.message.includes('Incorrect API key')) {
      console.log('💡 SOLUÇÃO: API key inválida');
      console.log('   1. Acesse: https://platform.openai.com/api-keys');
      console.log('   2. Verifique se a key está correta');
      console.log('   3. Gere uma nova key se necessário\n');
    } else if (error.message.includes('quota')) {
      console.log('💡 SOLUÇÃO: Limite de quota excedido');
      console.log('   1. Verifique seu uso em: https://platform.openai.com/usage');
      console.log('   2. Adicione créditos se necessário\n');
    } else if (error.message.includes('429')) {
      console.log('💡 SOLUÇÃO: Muitas requisições');
      console.log('   Aguarde alguns segundos e tente novamente\n');
    }
    
    console.log('⚠️  Sistema usará FALLBACK (análise simples)\n');
    
    return false;
  }
}

testarOpenAI()
  .then(sucesso => process.exit(sucesso ? 0 : 1))
  .catch(err => {
    console.error('\n❌ ERRO FATAL:', err.message);
    process.exit(1);
  });

