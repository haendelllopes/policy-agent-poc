// Cliente Supabase Frontend - PRODUÇÃO com fallback robusto
const supabaseUrl = 'https://gxqwfltteimexngybwna.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cXdmbHR0ZWltZXhuZ3lid25hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTg4MzMsImV4cCI6MjA3NTA5NDgzM30.522lie-dDK_0ct6X1iYpQcI2RZaH6sq8s9jjwTY8AOI';

// Função para inicializar Supabase com fallback assíncrono robusto
function initializeSupabase() {
    return new Promise((resolve) => {
        const checkSupabase = () => {
            // Verificar se createClient está disponível e totalmente carregado
            if (typeof createClient !== 'undefined' && typeof createClient === 'function') {
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
                    resolve(supabase);
                } catch (error) {
                    console.error('❌ Erro ao criar cliente Supabase:', error);
                    resolve(null);
                }
            } else {
                // Aguardar mais um pouco antes de tentar novamente
                setTimeout(checkSupabase, 100);
            }
        };
        
        // Iniciar verificação
        checkSupabase();
    });
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

// Função para inicializar de forma assíncrona
async function initSupabaseClient() {
    try {
        supabaseClient = await initializeSupabase();
        if (supabaseClient) {
            console.log('✅ Supabase inicializado com sucesso');
        } else {
            console.log('⚠️ Supabase não disponível, usando modo fallback');
        }
    } catch (error) {
        console.error('❌ Erro na inicialização do Supabase:', error);
        supabaseClient = null;
    }
}

// Tentar inicializar imediatamente
initSupabaseClient();

// Exportar para uso global
window.supabase = supabaseClient;
