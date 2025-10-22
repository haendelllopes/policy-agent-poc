require('dotenv').config();
const { supabase, testConnection } = require('./src/supabase/client');

async function testRealConnection() {
  console.log('🧪 TESTE CONEXÃO REAL SUPABASE');
  console.log('==============================\n');

  // 1. Testar conexão básica
  console.log('1️⃣ Testando conexão real...');
  const connected = await testConnection();
  
  if (!connected) {
    console.log('❌ Conexão falhou - Verifique a ANON_KEY');
    return false;
  }

  // 2. Testar Realtime
  console.log('\n2️⃣ Testando Realtime...');
  try {
    const SupabaseRealtimeConfig = require('./src/supabase/realtime');
    const realtimeConfig = new SupabaseRealtimeConfig();
    
    const realtimeConnected = await realtimeConfig.connect();
    
    if (!realtimeConnected) {
      console.log('❌ Realtime falhou');
      return false;
    }
    
    console.log('✅ Realtime conectado');
    
    // Testar canal
    const channel = realtimeConfig.createChannel('test-channel', 'colaboradores', (payload) => {
      console.log('📨 Evento recebido:', payload);
    });
    
    if (channel) {
      console.log('✅ Canal de teste criado');
      
      // Cleanup
      setTimeout(() => {
        realtimeConfig.disconnectChannel('test-channel');
        realtimeConfig.disconnectAll();
        console.log('🔌 Conexões limpas');
      }, 2000);
    }
    
  } catch (error) {
    console.error('❌ Erro Realtime:', error.message);
    return false;
  }

  console.log('\n🎉 CONEXÃO REAL FUNCIONANDO!');
  console.log('\n🚀 Pronto para Fase 2: Configuração do Banco de Dados');

  return true;
}

testRealConnection().catch(console.error);

