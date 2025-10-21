const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarConversas() {
  try {
    console.log('🔍 Verificando conversas na tabela conversation_history...');
    
    // Buscar todas as conversas
    const { data: conversations, error } = await supabase
      .from('conversation_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('❌ Erro ao buscar conversas:', error);
      return;
    }
    
    if (!conversations || conversations.length === 0) {
      console.log('❌ Nenhuma conversa encontrada');
      return;
    }
    
    console.log(`✅ Encontradas ${conversations.length} conversas:`);
    
    // Agrupar por usuário
    const conversationsByUser = {};
    conversations.forEach(conv => {
      if (!conversationsByUser[conv.user_id]) {
        conversationsByUser[conv.user_id] = [];
      }
      conversationsByUser[conv.user_id].push(conv);
    });
    
    console.log('\n📋 Conversas por usuário:');
    Object.keys(conversationsByUser).forEach(userId => {
      const userConversations = conversationsByUser[userId];
      console.log(`\n👤 Usuário ${userId}:`);
      console.log(`   • Total de mensagens: ${userConversations.length}`);
      console.log(`   • Última mensagem: ${userConversations[0].created_at}`);
      console.log(`   • Primeira mensagem: ${userConversations[0].content.substring(0, 50)}...`);
      
      // Verificar se é o usuário correto
      if (userId === '4ab6c765-bcfc-4280-84cd-3190fcf881c2') {
        console.log('   ✅ Este é o usuário correto (Haendell Lopes)');
      } else if (userId === 'a4cd1933-f066-4595-a0b6-614a603f4bd3') {
        console.log('   ❌ Este é o usuário teste (Usuário teste)');
      }
    });
    
    // Verificar se há conversas do usuário teste que podem estar causando confusão
    const usuarioTesteConversas = conversationsByUser['a4cd1933-f066-4595-a0b6-614a603f4bd3'];
    if (usuarioTesteConversas && usuarioTesteConversas.length > 0) {
      console.log('\n⚠️ PROBLEMA IDENTIFICADO:');
      console.log('   • Existem conversas do "Usuário teste"');
      console.log('   • Isso pode estar causando confusão no GPT');
      console.log('   • O sistema pode estar carregando essas conversas antigas');
    }
    
    // Verificar se há conversas do usuário correto
    const usuarioCorretoConversas = conversationsByUser['4ab6c765-bcfc-4280-84cd-3190fcf881c2'];
    if (usuarioCorretoConversas && usuarioCorretoConversas.length > 0) {
      console.log('\n✅ SOLUÇÃO:');
      console.log('   • Existem conversas do usuário correto (Haendell Lopes)');
      console.log('   • O problema pode estar no histórico sendo carregado');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

verificarConversas();
