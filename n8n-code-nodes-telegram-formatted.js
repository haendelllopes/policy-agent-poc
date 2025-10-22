/**
 * N8N Code Node - Formatação de Links para Telegram
 * 
 * Substitua o código atual dos Code nodes do N8N por este código melhorado
 * que formata automaticamente todos os links para Telegram com botões inline.
 */

// ===================================================================
// SISTEMA DE FORMATAÇÃO DE LINKS PARA TELEGRAM
// ===================================================================

class TelegramLinkFormatter {
  constructor() {
    this.icones = {
      'dashboard': '📱',
      'documento': '📄',
      'video': '🎥',
      'trilha': '🎯',
      'quiz': '📝',
      'slack': '💬',
      'telegram': '📱',
      'external': '🔗',
      'pdf': '📄',
      'youtube': '🎥',
      'drive': '☁️',
      'confluence': '📚',
      'notion': '📝'
    };
  }

  detectarTipoLink(url) {
    if (!url) return 'external';
    
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('dashboard') || urlLower.includes('colaborador-dashboard')) return 'dashboard';
    if (urlLower.includes('trilha') || urlLower.includes('trail')) return 'trilha';
    if (urlLower.includes('quiz') || urlLower.includes('test')) return 'quiz';
    if (urlLower.includes('slack://') || urlLower.includes('slack.com')) return 'slack';
    if (urlLower.includes('t.me') || urlLower.includes('telegram')) return 'telegram';
    if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) return 'youtube';
    if (urlLower.includes('drive.google.com') || urlLower.includes('docs.google.com')) return 'drive';
    if (urlLower.includes('confluence')) return 'confluence';
    if (urlLower.includes('notion.so') || urlLower.includes('notion.site')) return 'notion';
    if (urlLower.includes('.pdf')) return 'pdf';
    if (urlLower.includes('.mp4') || urlLower.includes('.avi') || urlLower.includes('vimeo.com')) return 'video';
    if (urlLower.includes('.doc') || urlLower.includes('.docx') || urlLower.includes('.txt')) return 'documento';
    
    return 'external';
  }

  formatarLink(url, titulo = null, descricao = null) {
    const tipo = this.detectarTipoLink(url);
    const icone = this.icones[tipo];
    const tituloFinal = titulo || this.getTituloPadrao(tipo);
    
    let mensagem = `${icone} *${tituloFinal}:*\n\n`;
    mensagem += `[🔗 Abrir Link](${url})\n\n`;
    
    if (descricao) {
      mensagem += `📝 *Descrição:* ${descricao}\n\n`;
    }
    
    const dicas = {
      'dashboard': '💡 *Dica:* Use o botão acima para acompanhar seu progresso!',
      'documento': '💡 *Dica:* Use o botão acima para visualizar o documento!',
      'video': '💡 *Dica:* Use o botão acima para assistir o vídeo!',
      'trilha': '💡 *Dica:* Use o botão acima para começar a trilha!',
      'quiz': '💡 *Dica:* Use o botão acima para fazer o quiz!',
      'slack': '💡 *Dica:* Use o botão acima para abrir no Slack!',
      'telegram': '💡 *Dica:* Use o botão acima para abrir no Telegram!',
      'pdf': '💡 *Dica:* Use o botão acima para baixar o PDF!',
      'youtube': '💡 *Dica:* Use o botão acima para assistir no YouTube!',
      'drive': '💡 *Dica:* Use o botão acima para abrir no Google Drive!',
      'confluence': '💡 *Dica:* Use o botão acima para acessar no Confluence!',
      'notion': '💡 *Dica:* Use o botão acima para abrir no Notion!',
      'external': '💡 *Dica:* Use o botão acima para abrir o link!'
    };
    
    mensagem += dicas[tipo] || dicas['external'];
    
    return mensagem;
  }

  getTituloPadrao(tipo) {
    const titulos = {
      'dashboard': 'Painel Pessoal',
      'documento': 'Documento',
      'video': 'Vídeo',
      'trilha': 'Trilha',
      'quiz': 'Quiz',
      'slack': 'Chat Slack',
      'telegram': 'Chat Telegram',
      'external': 'Link Externo',
      'pdf': 'PDF',
      'youtube': 'Vídeo YouTube',
      'drive': 'Google Drive',
      'confluence': 'Confluence',
      'notion': 'Notion'
    };
    
    return titulos[tipo] || 'Link Externo';
  }

  // Criar botões inline para Telegram
  criarBotoesInline(url, titulo = null) {
    const tipo = this.detectarTipoLink(url);
    const icone = this.icones[tipo];
    const tituloFinal = titulo || this.getTituloPadrao(tipo);
    
    return [{
      text: `${icone} ${tituloFinal}`,
      url: url
    }];
  }
}

// ===================================================================
// CÓDIGO PARA CODE NODES DO N8N - TELEGRAM
// ===================================================================

// Instanciar o formatador
const linkFormatter = new TelegramLinkFormatter();

// ===================================================================
// 1️⃣ CODE NODE: Formatar Resposta - Trilhas Disponíveis (Telegram)
// ===================================================================

const trilhas = $input.first().json;
const sentimento = $('1️⃣ Analisar Sentimento').first().json.sentiment;

let resposta = "📚 *Trilhas Disponíveis:*\n\n";

// Trilhas disponíveis
if (trilhas.disponiveis && trilhas.disponiveis.length > 0) {
  resposta += "🆕 *Novas Trilhas:*\n";
  trilhas.disponiveis.forEach((trilha, index) => {
    resposta += `${index + 1}. ${trilha.nome}\n`;
    resposta += `   📅 Prazo: ${trilha.prazo_dias} dias\n`;
    resposta += `   📝 ${trilha.descricao}\n\n`;
  });
}

// Trilhas em andamento
if (trilhas.em_andamento && trilhas.em_andamento.length > 0) {
  resposta += "⏳ *Em Andamento:*\n";
  trilhas.em_andamento.forEach(trilha => {
    resposta += `• ${trilha.nome}\n`;
  });
  resposta += "\n";
}

// Trilhas concluídas
if (trilhas.concluidas && trilhas.concluidas.length > 0) {
  resposta += "✅ *Concluídas:*\n";
  trilhas.concluidas.forEach(trilha => {
    resposta += `• ${trilha.nome}\n`;
  });
  resposta += "\n";
}

// Ajustar tom baseado no sentimento
if (sentimento.sentimento === 'negativo' || sentimento.sentimento === 'muito_negativo') {
  resposta += "💡 *Vou te ajudar com isso!* Para começar uma trilha, digite:\n";
  resposta += "\"Quero começar a trilha [nome]\"\n\n";
  resposta += "🤗 *Estou aqui para te apoiar em qualquer dificuldade!*\n\n";
} else if (sentimento.sentimento === 'positivo' || sentimento.sentimento === 'muito_positivo') {
  resposta += "💡 *Ótimo!* Para começar uma trilha, digite:\n";
  resposta += "\"Quero começar a trilha [nome]\"\n\n";
  resposta += "🚀 *Vamos continuar esse momentum!*\n\n";
} else {
  resposta += "💡 *Para começar uma trilha, digite:*\n";
  resposta += "\"Quero começar a trilha [nome]\"\n\n";
}

// ✅ NOVO: Formatar link do dashboard
let botoesInline = [];
if (trilhas.dashboard_url) {
  resposta += linkFormatter.formatarLink(
    trilhas.dashboard_url, 
    'Painel Pessoal', 
    'Acompanhe seu progresso e trilhas'
  );
  
  // Adicionar botão inline
  botoesInline = linkFormatter.criarBotoesInline(
    trilhas.dashboard_url,
    'Painel Pessoal'
  );
}

return [{
  json: {
    output: resposta,
    channel: $('Merge').first().json.channel,
    from: $('Merge').first().json.from,
    tenantId: $('Merge').first().json.tenantId,
    reply_markup: botoesInline.length > 0 ? {
      inline_keyboard: [botoesInline]
    } : null
  }
}];

// ===================================================================
// 2️⃣ CODE NODE: Formatar Resposta - Início de Trilha (Telegram)
// ===================================================================

const resultado = $input.first().json;
const sentimento = $('1️⃣ Analisar Sentimento').first().json.sentiment;

if (resultado.success) {
  let resposta = `🎉 *Trilha Iniciada!*\n\n`;
  resposta += `📚 *${resultado.trilha.nome}*\n`;
  resposta += `📝 ${resultado.trilha.descricao}\n\n`;
  resposta += `⏰ *Prazo:* ${resultado.trilha.prazo_dias} dias\n`;
  resposta += `📅 *Data limite:* ${new Date(resultado.data_limite).toLocaleDateString('pt-BR')}\n\n`;
  
  let botoesInline = [];
  
  if (resultado.primeiro_conteudo) {
    resposta += `📄 *Primeiro conteúdo:*\n`;
    resposta += `${resultado.primeiro_conteudo.titulo}\n\n`;
    
    // ✅ NOVO: Formatar link do conteúdo
    resposta += linkFormatter.formatarLink(
      resultado.primeiro_conteudo.url,
      resultado.primeiro_conteudo.titulo,
      resultado.primeiro_conteudo.descricao
    );
    
    // Adicionar botão inline para o conteúdo
    botoesInline.push(...linkFormatter.criarBotoesInline(
      resultado.primeiro_conteudo.url,
      resultado.primeiro_conteudo.titulo
    ));
    
    resposta += "\n\n";
  }
  
  // ✅ NOVO: Formatar link do dashboard
  if (resultado.dashboard_url) {
    resposta += linkFormatter.formatarLink(
      resultado.dashboard_url,
      'Painel Pessoal',
      'Acompanhe seu progresso na trilha'
    );
    
    // Adicionar botão inline para o dashboard
    botoesInline.push(...linkFormatter.criarBotoesInline(
      resultado.dashboard_url,
      'Painel Pessoal'
    ));
    
    resposta += "\n\n";
  }
  
  // Ajustar dica baseada no sentimento
  if (sentimento.sentimento === 'negativo' || sentimento.sentimento === 'muito_negativo') {
    resposta += `💡 *Dica:* Estou aqui para te ajudar! Me avise se tiver qualquer dificuldade. 🤗`;
  } else if (sentimento.sentimento === 'positivo' || sentimento.sentimento === 'muito_positivo') {
    resposta += `💡 *Dica:* Vamos nessa! Me avise quando terminar ou se precisar de algo! 🚀`;
  } else {
    resposta += `💡 *Dica:* Me avise quando terminar ou se tiver alguma dificuldade!`;
  }
  
  return [{
    json: {
      output: resposta,
      channel: $input.first().json.channel,
      from: $input.first().json.from,
      tenantId: $input.first().json.tenantId,
      reply_markup: botoesInline.length > 0 ? {
        inline_keyboard: [botoesInline]
      } : null
    }
  }];
} else {
  let resposta = `❌ *Erro ao iniciar trilha*\n\n`;
  resposta += resultado.message || 'Erro desconhecido';
  
  return [{
    json: {
      output: resposta,
      channel: $input.first().json.channel,
      from: $input.first().json.from,
      tenantId: $input.first().json.tenantId
    }
  }];
}

// ===================================================================
// 3️⃣ CODE NODE: Formatar Resposta - Webhook Trilha Iniciada (Telegram)
// ===================================================================

const webhookData = $input.first().json.body;

let resposta = `🚀 *Nova Trilha Iniciada!*\n\n`;
resposta += `👋 Olá ${webhookData.colaborador_nome}!\n\n`;
resposta += `📚 *Trilha:* ${webhookData.trilha_nome}\n`;
resposta += `⏰ *Prazo:* ${webhookData.prazo_dias} dias\n`;
resposta += `📅 *Data limite:* ${new Date(webhookData.data_limite).toLocaleDateString('pt-BR')}\n\n`;

// ✅ NOVO: Formatar link do dashboard
const dashboardUrl = `https://navigator-gules.vercel.app/colaborador-dashboard.html?colaborador_id=${webhookData.colaborador_id}&tenant=${$('Merge').first().json.tenantId}`;
resposta += linkFormatter.formatarLink(
  dashboardUrl,
  'Painel Pessoal',
  'Acesse para acompanhar seu progresso'
);

// Criar botões inline
const botoesInline = linkFormatter.criarBotoesInline(
  dashboardUrl,
  'Painel Pessoal'
);

resposta += "\n\n";
resposta += `💡 *Dica:* Comece pelos conteúdos obrigatórios e não esqueça do prazo!\n`;
resposta += `📚 *Bons estudos!*`;

return [{
  json: {
    output: resposta,
    channel: $input.first().json.channel,
    from: $input.first().json.from,
    tenantId: $input.first().json.tenantId,
    reply_markup: {
      inline_keyboard: [botoesInline]
    }
  }
}];

// ===================================================================
// 4️⃣ CODE NODE: Formatar Resposta - Webhook Quiz Disponível (Telegram)
// ===================================================================

const webhookData = $input.first().json.body;

let resposta = `🎉 *Quiz Disponível!*\n\n`;
resposta += `👋 Olá ${webhookData.colaborador_nome}!\n\n`;
resposta += `✅ *Parabéns!* Você concluiu todos os conteúdos da trilha:\n`;
resposta += `📚 *${webhookData.trilha_nome}*\n\n`;
resposta += `📝 *Agora é hora do quiz!*\n`;
resposta += `🎯 *Objetivo:* Aprovação com 60% ou mais\n\n`;

// ✅ NOVO: Formatar link do dashboard
const dashboardUrl = `https://navigator-gules.vercel.app/colaborador-dashboard.html?colaborador_id=${webhookData.colaborador_id}&tenant=${$('Merge').first().json.tenantId}`;
resposta += linkFormatter.formatarLink(
  dashboardUrl,
  'Painel Pessoal',
  'Acesse para fazer o quiz'
);

// Criar botões inline
const botoesInline = linkFormatter.criarBotoesInline(
  dashboardUrl,
  'Painel Pessoal'
);

resposta += "\n\n";
resposta += `💡 *Dica:* Leia com calma e boa sorte! 🍀`;

return [{
  json: {
    output: resposta,
    channel: $input.first().json.channel,
    from: $input.first().json.from,
    tenantId: $input.first().json.tenantId,
    reply_markup: {
      inline_keyboard: [botoesInline]
    }
  }
}];

// ===================================================================
// 5️⃣ CODE NODE: Formatar Resposta - Webhook Trilha Concluída (Telegram)
// ===================================================================

const webhookData = $input.first().json.body;

let resposta = `🏆 *Trilha Concluída!*\n\n`;
resposta += `👋 Olá ${webhookData.colaborador_nome}!\n\n`;
resposta += `🎉 *Parabéns!* Você concluiu com sucesso a trilha:\n`;
resposta += `📚 *${webhookData.trilha_nome}*\n\n`;
resposta += `📊 *Sua pontuação:* ${webhookData.nota || 'N/A'}%\n`;
resposta += `⭐ *Pontos ganhos:* ${webhookData.pontos || 'N/A'}\n\n`;

// ✅ NOVO: Formatar link do dashboard
const dashboardUrl = `https://navigator-gules.vercel.app/colaborador-dashboard.html?colaborador_id=${webhookData.colaborador_id}&tenant=${$('Merge').first().json.tenantId}`;
resposta += linkFormatter.formatarLink(
  dashboardUrl,
  'Painel Pessoal',
  'Veja seu progresso completo'
);

// Criar botões inline
const botoesInline = linkFormatter.criarBotoesInline(
  dashboardUrl,
  'Painel Pessoal'
);

resposta += "\n\n";
resposta += `🚀 *Continue assim!* Você está indo muito bem!`;

return [{
  json: {
    output: resposta,
    channel: $input.first().json.channel,
    from: $input.first().json.from,
    tenantId: $input.first().json.tenantId,
    reply_markup: {
      inline_keyboard: [botoesInline]
    }
  }
}];
