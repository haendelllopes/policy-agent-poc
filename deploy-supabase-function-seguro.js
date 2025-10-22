/**
 * Script de Deploy da Supabase Edge Function
 * Solicita OpenAI API Key de forma segura
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

console.log('🚀 INICIANDO DEPLOY DA SUPABASE EDGE FUNCTION');
console.log('==============================================');

async function deployFunction() {
  try {
    // Solicitar OpenAI API Key
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const openaiKey = await new Promise((resolve) => {
      rl.question('🔑 Digite sua OpenAI API Key: ', (key) => {
        rl.close();
        resolve(key.trim());
      });
    });

    if (!openaiKey) {
      console.log('❌ OpenAI API Key é obrigatória');
      return;
    }

    console.log('✅ OpenAI API Key recebida');

    // Verificar se a função existe
    const functionPath = path.join(__dirname, 'supabase', 'functions', 'generate-embedding', 'index.ts');
    if (!fs.existsSync(functionPath)) {
      console.log('❌ Função não encontrada em:', functionPath);
      return;
    }

    console.log('✅ Função encontrada:', functionPath);

    // Login no Supabase (se necessário)
    console.log('🔐 Verificando login no Supabase...');
    try {
      execSync('npx supabase projects list', { stdio: 'pipe' });
      console.log('✅ Login verificado');
    } catch (error) {
      console.log('🔑 Fazendo login no Supabase...');
      console.log('💡 Abra o navegador e faça login quando solicitado');
      execSync('npx supabase login', { stdio: 'inherit' });
    }

    // Deploy da função
    console.log('📦 Fazendo deploy da função generate-embedding...');
    execSync('npx supabase functions deploy generate-embedding', { stdio: 'inherit' });
    console.log('✅ Deploy realizado com sucesso!');

    // Configurar secret
    console.log('🔐 Configurando OPENAI_API_KEY...');
    execSync(`npx supabase secrets set OPENAI_API_KEY=${openaiKey}`, { stdio: 'inherit' });
    console.log('✅ Secret configurado com sucesso!');

    // Testar função
    console.log('🧪 Testando função...');
    execSync('node teste-supabase-embedding-function.js', { stdio: 'inherit' });

    console.log('');
    console.log('🎉 DEPLOY CONCLUÍDO COM SUCESSO!');
    console.log('=================================');
    console.log('🌐 URL da função: https://gxqwfltteimexngybwna.supabase.co/functions/v1/generate-embedding');
    console.log('🔧 Configure no N8N:');
    console.log('   - URL: https://gxqwfltteimexngybwna.supabase.co/functions/v1/generate-embedding');
    console.log('   - Method: POST');
    console.log('   - Headers: Authorization: Bearer SUA_SUPABASE_ANON_KEY');
    console.log('   - Body: {"text": "{{ $json.conteudo_extraido }}"}');
    console.log('');
    console.log('🚀 Função pronta para uso!');

  } catch (error) {
    console.error('❌ ERRO NO DEPLOY:', error.message);
    console.log('');
    console.log('🔧 POSSÍVEIS SOLUÇÕES:');
    console.log('1. Verificar se OpenAI API Key está correta');
    console.log('2. Verificar se está logado no Supabase');
    console.log('3. Verificar se a função foi criada corretamente');
    console.log('4. Verificar conexão com internet');
  }
}

// Executar deploy
deployFunction();
