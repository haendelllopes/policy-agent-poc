// Cliente Supabase Frontend - PRODUÇÃO
const supabaseUrl = 'https://gxqwfltteimexngybwna.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cXdmbHR0ZWltZXhuZ3lid25hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTg4MzMsImV4cCI6MjA3NTA5NDgzM30.522lie-dDK_0ct6X1iYpQcI2RZaH6sq8s9jjwTY8AOI';

// Verificar se createClient está disponível
if (typeof createClient !== 'undefined') {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });
  
  window.supabase = supabase;
  console.log('✅ Cliente Supabase carregado');
} else {
  console.error('❌ createClient não está disponível. Carregue @supabase/supabase-js primeiro.');
}
