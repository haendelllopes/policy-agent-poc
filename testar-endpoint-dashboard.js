require('dotenv').config();
const http = require('http');

const tenantId = '5978f911-738b-4aae-802a-f037fdac2e64';
const port = process.env.PORT || 3000;
const url = `http://localhost:${port}/api/dashboard/metrics/${tenantId}`;

console.log(`\n🔍 TESTANDO ENDPOINT DO DASHBOARD\n`);
console.log(`URL: ${url}\n`);

http.get(url, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('✅ Resposta recebida:');
      console.log(JSON.stringify(json.graficos?.sentimentoPorCargo, null, 2));
      
      if (json.graficos?.sentimentoPorCargo) {
        console.log('\n📊 Dados de Sentimento por Cargo:');
        json.graficos.sentimentoPorCargo.forEach(item => {
          console.log(`   ${item.cargo}: ${item.sentimento}/5`);
        });
      } else {
        console.log('\n❌ Não há dados de sentimento por cargo na resposta');
      }
      
    } catch (e) {
      console.log('\n❌ Erro ao parsear JSON:', e.message);
      console.log('\n📄 Resposta completa:');
      console.log(data);
    }
    
    process.exit();
  });
}).on('error', (err) => {
  console.log('\n❌ Erro ao conectar:', err.message);
  console.log('\n💡 Certifique-se de que o servidor está rodando na porta', port);
  process.exit(1);
});

