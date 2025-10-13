/**
 * Testa o endpoint de feedback de trilhas
 */

const axios = require('axios');

const BASE_URL = 'https://navigator-gules.vercel.app';

async function testarFeedback() {
  console.log('\n🧪 TESTANDO ENDPOINT DE FEEDBACK DE TRILHAS\n');
  console.log('='.repeat(70));
  
  try {
    // Teste 1: Registrar feedback
    console.log('\n1️⃣ Testando POST /api/agent/trilhas/feedback\n');
    
    const feedbackData = {
      colaborador_id: '556291708483', // Telefone de teste
      trilha_id: '7af41fde-6750-4db8-a1ec-b5eea8e0d0d1', // ID de trilha conhecida
      feedback: 'Teste de feedback automático - Trilha muito boa!',
      tipo_feedback: 'elogio'
    };
    
    console.log('📤 Enviando feedback:');
    console.log(JSON.stringify(feedbackData, null, 2));
    
    const response = await axios.post(`${BASE_URL}/api/agent/trilhas/feedback`, feedbackData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n✅ Resposta do servidor:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Teste 2: Verificar se foi salvo no banco
    console.log('\n2️⃣ Verificando se feedback foi salvo...\n');
    
    const { Pool } = require('pg');
    require('dotenv').config();
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000
    });
    
    const result = await pool.query(`
      SELECT 
        id,
        feedback,
        tipo_feedback,
        created_at
      FROM trilha_feedbacks
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log('📊 Últimos 5 feedbacks no banco:');
    console.table(result.rows);
    
    await pool.end();
    
    console.log('\n' + '='.repeat(70));
    console.log('\n🎉 Teste concluído com sucesso!\n');
    
  } catch (error) {
    console.error('\n❌ ERRO no teste:', error.message);
    
    if (error.response) {
      console.error('\n📋 Resposta do servidor:');
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    process.exit(1);
  }
}

testarFeedback()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });


