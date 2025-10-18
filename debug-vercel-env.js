// Script para debug das variáveis de ambiente no Vercel
console.log('🔍 Debug das variáveis de ambiente no Vercel:');
console.log('=====================================');

// Verificar se está no Vercel
console.log('VERCEL:', process.env.VERCEL);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Verificar variáveis de banco
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Configurada' : '❌ Não configurada');
console.log('PGUSER:', process.env.PGUSER ? '✅ Configurada' : '❌ Não configurada');
console.log('PGPASSWORD:', process.env.PGPASSWORD ? '✅ Configurada' : '❌ Não configurada');
console.log('PGHOST:', process.env.PGHOST ? '✅ Configurada' : '❌ Não configurada');
console.log('PGPORT:', process.env.PGPORT ? '✅ Configurada' : '❌ Não configurada');
console.log('PGDATABASE:', process.env.PGDATABASE ? '✅ Configurada' : '❌ Não configurada');

// Verificar outras variáveis importantes
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Configurada' : '❌ Não configurada');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ Não configurada');

// Mostrar primeiros caracteres da DATABASE_URL se existir
if (process.env.DATABASE_URL) {
  console.log('DATABASE_URL (primeiros 50 chars):', process.env.DATABASE_URL.substring(0, 50) + '...');
}

console.log('=====================================');
console.log('✅ Debug concluído');
