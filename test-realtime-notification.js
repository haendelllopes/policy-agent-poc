const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://gxqwfltteimexngybwna.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_KEY não configurada');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNotification() {
  console.log('🧪 Testando notificação Realtime...');
  
  try {
    // Simular notificação crítica
    const { data, error } = await supabase
      .from('admin_notifications')
      .insert({
        admin_id: '3ba1e64a-88f1-4aa0-aa9a-4615a5b7e1f2', // ID do admin de teste
        tenant_id: '5978f911-738b-4aae-802a-f037fdac2e64', // Tenant demo
        tipo: 'urgencia_critica',
        colaborador_nome: 'Usuário Teste',
        colaborador_email: 'teste@example.com',
        colaborador_phone: '+556291708483',
        problema: 'Estou há 3 dias sem conseguir acessar a plataforma',
        urgencia: 'critica',
        categoria: 'tecnico',
        acao_sugerida: 'Verificar credenciais de acesso e contatar TI',
        anotacao_id: null,
        lida: false
      });

    if (error) {
      console.error('❌ Erro ao inserir notificação:', error);
      return;
    }

    console.log('✅ Notificação criada com sucesso:', data);
    console.log('🔔 O admin deveria receber esta notificação em tempo real no dashboard');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testNotification();

