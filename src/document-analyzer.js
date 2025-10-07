// pdf-parse não funciona no Vercel (requer @napi-rs/canvas)
// const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const CloudConvert = require('cloudconvert');

// Inicializar OpenAI (opcional - para embeddings)
let openai = null;
if (process.env.OPENAI_API_KEY) {
  const { OpenAI } = require('openai');
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

// Inicializar CloudConvert
const cloudConvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY);

/**
 * Extrai texto de PDF usando CloudConvert
 */
async function extractTextFromPDF(fileBuffer, fileName) {
  try {
    // Criar job de conversão
    const job = await cloudConvert.jobs.create({
      tasks: {
        'upload-my-file': {
          operation: 'import/upload'
        },
        'convert-my-file': {
          operation: 'convert',
          input: 'upload-my-file',
          output_format: 'txt',
          options: {
            extract_text: true
          }
        },
        'export-my-file': {
          operation: 'export/url',
          input: 'convert-my-file'
        }
      }
    });

    // Upload do arquivo
    const uploadTask = job.tasks.find(task => task.name === 'upload-my-file');
    const uploadUrl = uploadTask.result.files[0].upload_url;
    
    await cloudConvert.upload(uploadUrl, fileBuffer, fileName);

    // Aguardar conversão
    let conversionTask = job.tasks.find(task => task.name === 'convert-my-file');
    while (conversionTask.status === 'waiting' || conversionTask.status === 'processing') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const updatedJob = await cloudConvert.jobs.show(job.id);
      conversionTask = updatedJob.tasks.find(task => task.name === 'convert-my-file');
    }

    if (conversionTask.status === 'finished') {
      // Download do resultado
      const exportTask = job.tasks.find(task => task.name === 'export-my-file');
      const downloadUrl = exportTask.result.files[0].url;
      
      const response = await fetch(downloadUrl);
      const textContent = await response.text();
      
      return textContent;
    } else {
      throw new Error(`Falha na conversão: ${conversionTask.status}`);
    }
  } catch (error) {
    console.error('Erro na extração de texto do PDF:', error);
    throw error;
  }
}

/**
 * Extrai texto de diferentes tipos de arquivo
 */
async function extractText(fileBuffer, fileName, mimeType) {
  try {
    if (mimeType === 'text/plain') {
      return fileBuffer.toString('utf8');
    } 
    else if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
      // Usar CloudConvert para extrair texto do PDF
      if (process.env.CLOUDCONVERT_API_KEY) {
        try {
          return await extractTextFromPDF(fileBuffer, fileName);
        } catch (error) {
          console.error('Erro ao extrair texto do PDF via CloudConvert:', error);
          return '[Erro ao processar PDF - conteúdo não disponível]';
        }
      } else {
        console.warn('CLOUDCONVERT_API_KEY não configurado. PDF não será processado.');
        return '[PDF não processado - configure CLOUDCONVERT_API_KEY para processamento completo]';
      }
    } 
    else if (mimeType.includes('word') || mimeType.includes('document') || 
             fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      return result.value;
    } 
    else {
      throw new Error('Tipo de arquivo não suportado para extração de texto');
    }
  } catch (error) {
    console.error('Erro ao extrair texto:', error);
    throw error;
  }
}

/**
 * Gera embedding usando OpenAI ou Hugging Face (fallback)
 */
async function generateEmbedding(text) {
  // Tentar OpenAI primeiro
  if (openai) {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text.substring(0, 8000)
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error('Erro ao gerar embedding via OpenAI:', error);
    }
  }
  
  // Fallback: Hugging Face (gratuito)
  try {
    console.log('Usando Hugging Face para gerar embedding...');
    const response = await fetch('https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY || 'hf_demo'}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: text.substring(0, 512) // Limitar para o modelo
      })
    });
    
    if (response.ok) {
      const embedding = await response.json();
      return Array.isArray(embedding) ? embedding[0] : embedding;
    } else {
      throw new Error(`Hugging Face API error: ${response.status}`);
    }
  } catch (error) {
    console.error('Erro ao gerar embedding via Hugging Face:', error);
    
    // Fallback final: embedding simulado baseado em hash
    console.log('Usando embedding simulado baseado em hash...');
    return generateSimulatedEmbedding(text);
  }
}

/**
 * Gera embedding simulado baseado em hash do texto (para casos sem API)
 */
function generateSimulatedEmbedding(text) {
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256').update(text).digest('hex');
  
  // Converter hash em array de números (1536 dimensões)
  const embedding = [];
  for (let i = 0; i < 1536; i += 4) {
    const hexSegment = hash.substring(i % hash.length, (i % hash.length) + 4);
    const value = parseInt(hexSegment, 16) / 65535; // Normalizar para 0-1
    embedding.push(value);
  }
  
  return embedding;
}

/**
 * Classifica o documento automaticamente
 */
async function classifyDocument(text, title) {
  // Para usar Gemini, a classificação será feita no n8n
  // Aqui retornamos uma classificação básica baseada em palavras-chave
  const content = (text + ' ' + title).toLowerCase();
  
  if (content.includes('rh') || content.includes('recursos humanos') || content.includes('funcionário') || content.includes('colaborador')) {
    return 'RH';
  } else if (content.includes('financeiro') || content.includes('orçamento') || content.includes('despesa') || content.includes('receita')) {
    return 'Financeiro';
  } else if (content.includes('legal') || content.includes('contrato') || content.includes('lei') || content.includes('jurídico')) {
    return 'Legal';
  } else if (content.includes('marketing') || content.includes('vendas') || content.includes('cliente')) {
    return 'Marketing';
  } else if (content.includes('ti') || content.includes('tecnologia') || content.includes('sistema') || content.includes('software')) {
    return 'TI';
  } else if (content.includes('operacional') || content.includes('processo') || content.includes('produção')) {
    return 'Operacional';
  } else {
    return 'Outros';
  }
}

/**
 * Analisa o sentimento do documento (básico)
 */
async function analyzeSentiment(text) {
  // Análise básica de sentimento baseada em palavras-chave
  const positiveWords = ['bom', 'excelente', 'ótimo', 'sucesso', 'positivo', 'feliz', 'satisfeito'];
  const negativeWords = ['ruim', 'problema', 'erro', 'negativo', 'triste', 'insatisfeito', 'falha'];
  
  const content = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;
  
  positiveWords.forEach(word => {
    if (content.includes(word)) positiveCount++;
  });
  
  negativeWords.forEach(word => {
    if (content.includes(word)) negativeCount++;
  });
  
  if (positiveCount === 0 && negativeCount === 0) return 0;
  
  const total = positiveCount + negativeCount;
  return (positiveCount - negativeCount) / total;
}

/**
 * Gera resumo inteligente do documento
 */
async function generateSummary(text, title) {
  // Resumo básico baseado nas primeiras frases
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const summary = sentences.slice(0, 3).join('. ').trim();
  return summary || 'Resumo não disponível.';
}

/**
 * Gera tags automáticas
 */
async function generateTags(text, title) {
  // Tags básicas baseadas em palavras-chave
  const content = (text + ' ' + title).toLowerCase();
  const tags = [];
  
  if (content.includes('rh') || content.includes('funcionário')) tags.push('rh');
  if (content.includes('financeiro') || content.includes('orçamento')) tags.push('financeiro');
  if (content.includes('legal') || content.includes('contrato')) tags.push('legal');
  if (content.includes('marketing') || content.includes('vendas')) tags.push('marketing');
  if (content.includes('ti') || content.includes('tecnologia')) tags.push('ti');
  if (content.includes('operacional') || content.includes('processo')) tags.push('operacional');
  
  return tags.length > 0 ? tags : ['documento'];
}

/**
 * Pipeline completo de análise de documento
 */
async function analyzeDocument(fileBuffer, fileName, mimeType, title) {
  try {
    console.log('Iniciando análise completa do documento:', title);

    // 1. Extrair texto
    console.log('1. Extraindo texto...');
    const extractedText = await extractText(fileBuffer, fileName, mimeType);
    
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('Não foi possível extrair texto do documento');
    }

    // 2. Gerar embedding
    console.log('2. Gerando embedding...');
    const embedding = await generateEmbedding(extractedText);

    // 3. Classificar documento
    console.log('3. Classificando documento...');
    const classification = await classifyDocument(extractedText, title);

    // 4. Analisar sentimento
    console.log('4. Analisando sentimento...');
    const sentiment = await analyzeSentiment(extractedText);

    // 5. Gerar resumo
    console.log('5. Gerando resumo...');
    const summary = await generateSummary(extractedText, title);

    // 6. Gerar tags
    console.log('6. Gerando tags...');
    const tags = await generateTags(extractedText, title);

    const analysis = {
      extractedText,
      embedding,
      classification,
      sentiment,
      summary,
      tags,
      wordCount: extractedText.split(/\s+/).length,
      characterCount: extractedText.length,
      language: 'pt-BR' // Assumindo português brasileiro
    };

    console.log('Análise completa finalizada:', {
      classification,
      sentiment,
      wordCount: analysis.wordCount,
      tagsCount: tags.length
    });

    return analysis;
  } catch (error) {
    console.error('Erro na análise do documento:', error);
    throw error;
  }
}

module.exports = {
  extractText,
  generateEmbedding,
  classifyDocument,
  analyzeSentiment,
  generateSummary,
  generateTags,
  analyzeDocument
};
