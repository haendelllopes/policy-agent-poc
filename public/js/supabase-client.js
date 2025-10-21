// Cliente Supabase Frontend - PRODUÇÃO com fallback robusto
const supabaseUrl = 'https://gxqwfltteimexngybwna.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cXdmbHR0ZWltZXhuZ3lid25hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTg4MzMsImV4cCI6MjA3NTA5NDgzM30.522lie-dDK_0ct6X1iYpQcI2RZaH6sq8s9jjwTY8AOI';

// Função para inicializar Supabase com fallback
function initializeSupabase() {
    // Verificar se createClient está disponível
    if (typeof createClient !== 'undefined') {
        try {
            const supabase = createClient(supabaseUrl, supabaseAnonKey, {
                realtime: {
                    params: {
                        eventsPerSecond: 10
                    }
                }
            });
            
            window.supabase = supabase;
            console.log('✅ Cliente Supabase carregado com sucesso');
            
            // Testar conexão
            testSupabaseConnection(supabase);
            
            return supabase;
        } catch (error) {
            console.error('❌ Erro ao criar cliente Supabase:', error);
            return null;
        }
    } else {
        console.warn('⚠️ createClient não está disponível. Usando modo fallback.');
        return null;
    }
}

// Função para testar conexão Supabase
async function testSupabaseConnection(supabase) {
    try {
        const { data, error } = await supabase
            .from('chat_messages')
            .select('id')
            .limit(1);
        
        if (error) {
            console.warn('⚠️ Erro na conexão Supabase:', error.message);
        } else {
            console.log('✅ Conexão Supabase testada com sucesso');
        }
    } catch (error) {
        console.warn('⚠️ Erro ao testar conexão:', error.message);
    }
}

// Inicializar Supabase quando disponível
let supabaseClient = null;

// Tentar inicializar imediatamente
supabaseClient = initializeSupabase();

// Se não funcionou, tentar novamente após um delay
if (!supabaseClient) {
    setTimeout(() => {
        supabaseClient = initializeSupabase();
    }, 1000);
}

// Exportar para uso global
window.supabase = supabaseClient;
