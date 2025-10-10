const http = require('http');

console.log('🔍 Testando conexão com servidor...\n');

// Teste simples de conexão
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/health',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`✅ Servidor está respondendo! Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📦 Resposta:', data);
    console.log('\n🧪 Agora vamos testar o endpoint de sentimentos...\n');
    
    // Testar POST /api/sentimentos
    const sentimentoData = JSON.stringify({
      colaborador_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      sentimento: 'muito_positivo',
      intensidade: 0.95,
      origem: 'chat',
      mensagem_analisada: 'Teste rápido!'
    });
    
    const postOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/sentimentos',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(sentimentoData)
      }
    };
    
    const postReq = http.request(postOptions, (postRes) => {
      console.log(`✅ POST /api/sentimentos Status: ${postRes.statusCode}`);
      
      let postData = '';
      postRes.on('data', (chunk) => {
        postData += chunk;
      });
      
      postRes.on('end', () => {
        console.log('📦 Resposta:', postData);
        console.log('\n🎉 Teste concluído!');
      });
    });
    
    postReq.on('error', (error) => {
      console.error(`❌ Erro ao testar POST: ${error.message}`);
    });
    
    postReq.write(sentimentoData);
    postReq.end();
  });
});

req.on('error', (error) => {
  console.error(`❌ Erro ao conectar ao servidor: ${error.message}`);
  console.error(`\n💡 Dica: Certifique-se de que o servidor está rodando com 'npm run dev'`);
  process.exit(1);
});

req.end();

