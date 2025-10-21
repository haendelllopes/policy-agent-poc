const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function criarUsuarioComServiceRole() {
  try {
    console.log('🔍 Tentando criar usuário com service role...');
    
    // Usar service role key se disponível
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceRoleKey) {
      console.log('🔑 Usando service role key...');
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
      
      const userId = '4ab6c765-bcfc-4280-84cd-3190fcf881c2';
      const tenantId = '5978f911-738b-4aae-802a-f037fdac2e64';
      
      // Criar tenant primeiro
      console.log('🏢 Criando tenant...');
      const { error: tenantError } = await supabaseAdmin
        .from('tenants')
        .upsert({
          id: tenantId,
          name: 'Demonstração',
          subdomain: 'demo',
          created_at: new Date().toISOString()
        });
      
      if (tenantError) {
        console.error('❌ Erro ao criar tenant:', tenantError);
      } else {
        console.log('✅ Tenant criado/atualizado');
      }
      
      // Criar usuário
      console.log('👤 Criando usuário...');
      const { error: userError } = await supabaseAdmin
        .from('users')
        .upsert({
          id: userId,
          tenant_id: tenantId,
          name: 'Haendell Lopes',
          email: 'haend@demo.com',
          phone: '+5562912345678',
          position: 'Desenvolvedor Full Stack',
          department: 'Tecnologia',
          position_id: 'dev-fullstack-001',
          department_id: 'tech-001',
          gestor_id: null,
          buddy_id: null,
          start_date: '2024-01-01',
          status: 'active',
          onboarding_status: 'em_andamento',
          onboarding_inicio: '2024-01-01',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (userError) {
        console.error('❌ Erro ao criar usuário:', userError);
      } else {
        console.log('✅ Usuário criado/atualizado');
      }
      
      // Verificar se foi criado
      const { data: user, error: verifyError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (verifyError) {
        console.error('❌ Erro ao verificar usuário:', verifyError);
      } else {
        console.log('✅ Usuário verificado:');
        console.log(`   • Nome: ${user.name}`);
        console.log(`   • Email: ${user.email}`);
        console.log(`   • Cargo: ${user.position}`);
        console.log(`   • Departamento: ${user.department}`);
        console.log(`   • Tenant ID: ${user.tenant_id}`);
      }
      
    } else {
      console.log('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada');
      console.log('💡 Alternativa: Criar usuário manualmente no Supabase Dashboard');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

criarUsuarioComServiceRole();
