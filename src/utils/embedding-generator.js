/**
 * Utilitário para Geração de Embeddings
 * 
 * Gera embeddings usando OpenAI para busca semântica
 * nos conteúdos processados das trilhas.
 */

const OpenAI = require('openai');

// Configurar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Gera embedding para um texto usando OpenAI
 * @param {string} text - Texto para gerar embedding
 * @returns {Array<number>} - Array de números representando o embedding
 */
async function generateEmbedding(text) {
  try {
    if (!text || typeof text !== 'string') {
      throw new Error('Texto é obrigatório e deve ser uma string');
    }

    // Limitar tamanho do texto (OpenAI tem limite de 8192 tokens)
    const maxLength = 8000;
    const truncatedText = text.length > maxLength ? text.substring(0, maxLength) : text;

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: truncatedText,
      encoding_format: 'float'
    });

    if (!response.data || !response.data[0] || !response.data[0].embedding) {
      throw new Error('Resposta inválida da API OpenAI');
    }

    return response.data[0].embedding;

  } catch (error) {
    console.error('Erro ao gerar embedding:', error);
    
    // Em caso de erro, retornar embedding zero (fallback)
    // Isso permite que o sistema continue funcionando mesmo sem OpenAI
    console.warn('⚠️ Usando embedding fallback devido a erro na API');
    return new Array(1536).fill(0);
  }
}

/**
 * Gera embeddings para múltiplos textos
 * @param {Array<string>} texts - Array de textos
 * @returns {Array<Array<number>>} - Array de embeddings
 */
async function generateEmbeddingsBatch(texts) {
  try {
    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error('Array de textos é obrigatório');
    }

    // Limitar batch size (OpenAI tem limite de 2048 inputs por request)
    const batchSize = 100;
    const results = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: batch,
        encoding_format: 'float'
      });

      if (response.data) {
        results.push(...response.data.map(item => item.embedding));
      }
    }

    return results;

  } catch (error) {
    console.error('Erro ao gerar embeddings em batch:', error);
    
    // Fallback: gerar embeddings individuais
    console.warn('⚠️ Fallback para geração individual de embeddings');
    const results = [];
    for (const text of texts) {
      const embedding = await generateEmbedding(text);
      results.push(embedding);
    }
    return results;
  }
}

/**
 * Calcula similaridade entre dois embeddings usando cosine similarity
 * @param {Array<number>} embedding1 - Primeiro embedding
 * @param {Array<number>} embedding2 - Segundo embedding
 * @returns {number} - Score de similaridade (0 a 1)
 */
function calculateSimilarity(embedding1, embedding2) {
  try {
    if (!Array.isArray(embedding1) || !Array.isArray(embedding2)) {
      throw new Error('Embeddings devem ser arrays');
    }

    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings devem ter o mesmo tamanho');
    }

    // Calcular produto escalar
    let dotProduct = 0;
    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
    }

    // Calcular magnitudes
    let magnitude1 = 0;
    let magnitude2 = 0;
    
    for (let i = 0; i < embedding1.length; i++) {
      magnitude1 += embedding1[i] * embedding1[i];
      magnitude2 += embedding2[i] * embedding2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    // Evitar divisão por zero
    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    // Cosine similarity
    return dotProduct / (magnitude1 * magnitude2);

  } catch (error) {
    console.error('Erro ao calcular similaridade:', error);
    return 0;
  }
}

/**
 * Valida se um embedding é válido
 * @param {Array<number>} embedding - Embedding para validar
 * @returns {boolean} - True se válido
 */
function isValidEmbedding(embedding) {
  if (!Array.isArray(embedding)) {
    return false;
  }

  if (embedding.length !== 1536) {
    return false;
  }

  // Verificar se todos os valores são números
  return embedding.every(val => typeof val === 'number' && !isNaN(val));
}

/**
 * Converte embedding para formato JSONB do PostgreSQL
 * @param {Array<number>} embedding - Embedding
 * @returns {string} - JSON string para PostgreSQL
 */
function embeddingToJsonb(embedding) {
  if (!isValidEmbedding(embedding)) {
    throw new Error('Embedding inválido');
  }
  return JSON.stringify(embedding);
}

/**
 * Converte JSONB do PostgreSQL para embedding
 * @param {string} jsonbString - JSON string do PostgreSQL
 * @returns {Array<number>} - Embedding array
 */
function jsonbToEmbedding(jsonbString) {
  try {
    const embedding = JSON.parse(jsonbString);
    if (!isValidEmbedding(embedding)) {
      throw new Error('Embedding inválido no JSON');
    }
    return embedding;
  } catch (error) {
    console.error('Erro ao converter JSONB para embedding:', error);
    return new Array(1536).fill(0);
  }
}

module.exports = {
  generateEmbedding,
  generateEmbeddingsBatch,
  calculateSimilarity,
  isValidEmbedding,
  embeddingToJsonb,
  jsonbToEmbedding
};
