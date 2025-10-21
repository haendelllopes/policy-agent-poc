const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase credentials not found in environment variables');
}

console.log('🔌 Configurando cliente Supabase...');
console.log('📍 URL:', supabaseUrl);
console.log('🔑 Key:', supabaseAnonKey ? 'Presente' : 'Ausente');

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  auth: {
    persistSession: false // Para uso server-side
  }
});

// Testar conexão
async function testConnection() {
  try {
    console.log('🧪 Testando conexão Supabase...');
    
    const { data, error } = await supabase
      .from('colaboradores')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro conexão Supabase:', error.message);
      return false;
    }
    
    console.log('✅ Conexão Supabase OK');
    return true;
  } catch (error) {
    console.error('❌ Erro teste conexão:', error.message);
    return false;
  }
}

module.exports = {
  supabase,
  testConnection
};
