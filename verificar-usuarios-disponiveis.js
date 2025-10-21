const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarUsuarios() {
  try {
    console.log('🔍 Verificando usuários na tabela...');
    
    // Buscar todos os usuários
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, position, department, tenant_id')
      .limit(10);
    
    if (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('❌ Nenhum usuário encontrado na tabela');
      return;
    }
    
    console.log(`✅ Encontrados ${users.length} usuários:`);
    users.forEach((user, index) => {
      console.log(`\n👤 Usuário ${index + 1}:`);
      console.log(`   • ID: ${user.id}`);
      console.log(`   • Nome: ${user.name}`);
      console.log(`   • Email: ${user.email}`);
      console.log(`   • Cargo: ${user.position}`);
      console.log(`   • Departamento: ${user.department}`);
      console.log(`   • Tenant ID: ${user.tenant_id}`);
    });
    
    // Verificar se o ID específico existe
    const userIdEspecifico = '4ab6c765-bcfc-4280-84cd-3190fcf881c2';
    const usuarioEspecifico = users.find(u => u.id === userIdEspecifico);
    
    if (usuarioEspecifico) {
      console.log(`\n✅ Usuário específico encontrado:`);
      console.log(`   • Nome: ${usuarioEspecifico.name}`);
      console.log(`   • Email: ${usuarioEspecifico.email}`);
      console.log(`   • Cargo: ${usuarioEspecifico.position}`);
      console.log(`   • Departamento: ${usuarioEspecifico.department}`);
    } else {
      console.log(`\n❌ Usuário específico ${userIdEspecifico} não encontrado`);
      console.log('📋 IDs disponíveis:');
      users.forEach(u => console.log(`   • ${u.id}`));
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

verificarUsuarios();
