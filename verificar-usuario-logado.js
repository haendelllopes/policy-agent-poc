const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarUsuarioLogado() {
  try {
    console.log('🔍 Verificando usuário logado...');
    
    // ID do usuário que aparece nos logs
    const userId = '4ab6c765-bcfc-4280-84cd-3190fcf881c2';
    
    console.log(`📋 Buscando dados do usuário: ${userId}`);
    
    // Buscar dados do usuário
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('❌ Erro ao buscar usuário:', error);
      return;
    }
    
    if (!user) {
      console.log('❌ Usuário não encontrado');
      return;
    }
    
    console.log('✅ Dados do usuário encontrados:');
    console.log('📋 Informações pessoais:');
    console.log(`   • Nome: ${user.name}`);
    console.log(`   • Email: ${user.email}`);
    console.log(`   • Telefone: ${user.phone}`);
    console.log(`   • Status: ${user.status}`);
    
    console.log('🏢 Informações profissionais:');
    console.log(`   • Cargo: ${user.position}`);
    console.log(`   • Departamento: ${user.department}`);
    console.log(`   • Data de início: ${user.start_date}`);
    console.log(`   • Status do onboarding: ${user.onboarding_status}`);
    
    console.log('👥 Relacionamentos:');
    console.log(`   • Gestor ID: ${user.gestor_id}`);
    console.log(`   • Buddy ID: ${user.buddy_id}`);
    
    console.log('🏢 Tenant:');
    console.log(`   • Tenant ID: ${user.tenant_id}`);
    
    // Buscar informações do gestor se existir
    if (user.gestor_id) {
      console.log('\n👨‍💼 Buscando dados do gestor...');
      const { data: gestor, error: gestorError } = await supabase
        .from('users')
        .select('name, position, email')
        .eq('id', user.gestor_id)
        .single();
      
      if (gestorError) {
        console.log('⚠️ Erro ao buscar gestor:', gestorError.message);
      } else if (gestor) {
        console.log(`   • Nome do gestor: ${gestor.name}`);
        console.log(`   • Cargo do gestor: ${gestor.position}`);
        console.log(`   • Email do gestor: ${gestor.email}`);
      }
    }
    
    // Buscar informações do buddy se existir
    if (user.buddy_id) {
      console.log('\n🤝 Buscando dados do buddy...');
      const { data: buddy, error: buddyError } = await supabase
        .from('users')
        .select('name, position, email')
        .eq('id', user.buddy_id)
        .single();
      
      if (buddyError) {
        console.log('⚠️ Erro ao buscar buddy:', buddyError.message);
      } else if (buddy) {
        console.log(`   • Nome do buddy: ${buddy.name}`);
        console.log(`   • Cargo do buddy: ${buddy.position}`);
        console.log(`   • Email do buddy: ${buddy.email}`);
      }
    }
    
    // Verificar se há trilhas associadas
    console.log('\n📚 Verificando trilhas do usuário...');
    const { data: trilhas, error: trilhasError } = await supabase
      .from('user_trails')
      .select('trail_id, status, progress')
      .eq('user_id', userId);
    
    if (trilhasError) {
      console.log('⚠️ Erro ao buscar trilhas:', trilhasError.message);
    } else if (trilhas && trilhas.length > 0) {
      console.log(`   • Total de trilhas: ${trilhas.length}`);
      trilhas.forEach((trilha, index) => {
        console.log(`   • Trilha ${index + 1}: ID ${trilha.trail_id}, Status: ${trilha.status}, Progresso: ${trilha.progress}%`);
      });
    } else {
      console.log('   • Nenhuma trilha encontrada');
    }
    
    console.log('\n✅ Verificação concluída!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

verificarUsuarioLogado();
