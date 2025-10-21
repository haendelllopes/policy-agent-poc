require('dotenv').config();
const { supabase } = require('./src/supabase/client');

async function diagnosticarSupabaseProducao() {
  console.log('🔍 DIAGNÓSTICO SUPABASE EM PRODUÇÃO');
  console.log('====================================\n');

  try {
    // 1. Verificar variáveis de ambiente
    console.log('1️⃣ Verificando variáveis de ambiente...');
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    console.log(`SUPABASE_URL: ${supabaseUrl ? '✅ Presente' : '❌ Ausente'}`);
    console.log(`SUPABASE_ANON_KEY: ${supabaseKey ? '✅ Presente' : '❌ Ausente'}`);
    
    if (supabaseUrl) {
      console.log(`URL: ${supabaseUrl}`);
    }
    if (supabaseKey) {
      console.log(`Key: ${supabaseKey.substring(0, 20)}...`);
    }

    // 2. Testar conexão direta
    console.log('\n2️⃣ Testando conexão direta...');
    if (!supabase) {
      console.log('❌ Cliente Supabase não inicializado');
      return false;
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ Erro na conexão:', error.message);
      return false;
    }
    console.log('✅ Conexão Supabase OK');

    // 3. Verificar URLs de CDN alternativas
    console.log('\n3️⃣ URLs de CDN alternativas para testar:');
    const cdnUrls = [
      'https://unpkg.com/@supabase/supabase-js@2',
      'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/index.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/supabase/2.0.0/supabase.min.js'
    ];
    
    cdnUrls.forEach((url, index) => {
      console.log(`${index + 1}. ${url}`);
    });

    // 4. Verificar configurações de produção
    console.log('\n4️⃣ Configurações de produção recomendadas:');
    console.log('NODE_ENV=production');
    console.log('SUPABASE_URL=https://gxqwfltteimexngybwna.supabase.co');
    console.log('SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');

    // 5. Verificar arquivos de produção
    console.log('\n5️⃣ Verificando arquivos de produção...');
    const fs = require('fs');
    const files = [
      'public/test-supabase-chat.html',
      'public/js/supabase-client.js',
      'public/js/supabase-chat-widget.js'
    ];
    
    files.forEach(file => {
      if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
        
        // Verificar conteúdo do supabase-client.js
        if (file.includes('supabase-client.js')) {
          const content = fs.readFileSync(file, 'utf8');
          if (content.includes('createClient')) {
            console.log('  ✅ createClient encontrado');
          } else {
            console.log('  ❌ createClient não encontrado');
          }
        }
      } else {
        console.log(`❌ ${file} - FALTANDO`);
      }
    });

    console.log('\n🎯 DIAGNÓSTICO CONCLUÍDO!');
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Verificar se o CDN unpkg.com está funcionando');
    console.log('2. Testar URLs alternativas de CDN');
    console.log('3. Verificar variáveis de ambiente no Vercel');
    console.log('4. Implementar fallback para CDN local');

    return true;

  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
    return false;
  }
}

diagnosticarSupabaseProducao().catch(console.error);
