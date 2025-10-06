const { OpenAI } = require('openai');
// pdf-parse não funciona no Vercel (requer @napi-rs/canvas)
// const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const CloudConvert = require('cloudconvert');

// Inicializar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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
 * Gera embedding usando OpenAI
 */
async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text.substring(0, 8000) // Limitar tamanho
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Erro ao gerar embedding:', error);
    throw error;
  }
}

/**
 * Classifica o documento automaticamente
 */
async function classifyDocument(text, title) {
  try {
    const prompt = `Analise este documento e classifique-o em uma das seguintes categorias:
- RH (Recursos Humanos)
- Financeiro
- Legal
- Operacional
- Marketing
- TI (Tecnologia)
- Outros

Título: ${title}
Conteúdo: ${text.substring(0, 2000)}

Responda apenas com a categoria mais apropriada:`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 50
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Erro ao classificar documento:', error);
    return 'Outros';
  }
}

/**
 * Analisa o sentimento do documento
 */
async function analyzeSentiment(text) {
  try {
    const prompt = `Analise o sentimento deste documento em uma escala de -1 (muito negativo) a 1 (muito positivo).
Responda apenas com um número decimal entre -1 e 1.

Conteúdo: ${text.substring(0, 1500)}`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 10
    });

    const sentiment = parseFloat(response.choices[0].message.content.trim());
    return isNaN(sentiment) ? 0 : sentiment;
  } catch (error) {
    console.error('Erro ao analisar sentimento:', error);
    return 0;
  }
}

/**
 * Gera resumo inteligente do documento
 */
async function generateSummary(text, title) {
  try {
    const prompt = `Crie um resumo conciso e informativo deste documento em português brasileiro.
Máximo 200 palavras. Foque nos pontos principais e informações relevantes.

Título: ${title}
Conteúdo: ${text.substring(0, 4000)}

Resumo:`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 300
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Erro ao gerar resumo:', error);
    return 'Resumo não disponível';
  }
}

/**
 * Gera tags automáticas
 */
async function generateTags(text, title) {
  try {
    const prompt = `Analise este documento e gere 3-5 tags relevantes em português brasileiro.
As tags devem ser palavras-chave que descrevam o conteúdo.
Separe as tags com vírgula.

Título: ${title}
Conteúdo: ${text.substring(0, 2000)}

Tags:`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 100
    });

    const tagsText = response.choices[0].message.content.trim();
    return tagsText.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
  } catch (error) {
    console.error('Erro ao gerar tags:', error);
    return [];
  }
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
