/**
 * Sistema Universal de Formatação de Links
 * Data: 2025-10-21
 * 
 * Formata links para diferentes canais de comunicação:
 * - WhatsApp (N8N)
 * - Telegram (N8N) 
 * - Chat Flutuante (WebSocket)
 * - Email (N8N)
 */

class LinkFormatter {
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
      'notion': '📝',
      'email': '📧'
    };
    
    this.titulosPadrao = {
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
      'notion': 'Notion',
      'email': 'Email'
    };
  }

  /**
   * Detecta o tipo de link baseado na URL
   */
  detectarTipoLink(url) {
    if (!url) return 'external';
    
    const urlLower = url.toLowerCase();
    
    // Dashboard
    if (urlLower.includes('dashboard') || urlLower.includes('colaborador-dashboard')) {
      return 'dashboard';
    }
    
    // Trilhas
    if (urlLower.includes('trilha') || urlLower.includes('trail')) {
      return 'trilha';
    }
    
    // Quiz
    if (urlLower.includes('quiz') || urlLower.includes('test')) {
      return 'quiz';
    }
    
    // Slack
    if (urlLower.includes('slack://') || urlLower.includes('slack.com')) {
      return 'slack';
    }
    
    // Telegram
    if (urlLower.includes('t.me') || urlLower.includes('telegram')) {
      return 'telegram';
    }
    
    // YouTube
    if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
      return 'youtube';
    }
    
    // Google Drive
    if (urlLower.includes('drive.google.com') || urlLower.includes('docs.google.com')) {
      return 'drive';
    }
    
    // Confluence
    if (urlLower.includes('confluence')) {
      return 'confluence';
    }
    
    // Notion
    if (urlLower.includes('notion.so') || urlLower.includes('notion.site')) {
      return 'notion';
    }
    
    // PDFs
    if (urlLower.includes('.pdf')) {
      return 'pdf';
    }
    
    // Vídeos
    if (urlLower.includes('.mp4') || urlLower.includes('.avi') || urlLower.includes('vimeo.com')) {
      return 'video';
    }
    
    // Documentos
    if (urlLower.includes('.doc') || urlLower.includes('.docx') || urlLower.includes('.txt')) {
      return 'documento';
    }
    
    return 'external';
  }

  /**
   * Formata link para WhatsApp
   */
  formatarWhatsApp(url, titulo = null, descricao = null) {
    const tipo = this.detectarTipoLink(url);
    const icone = this.icones[tipo];
    const tituloFinal = titulo || this.titulosPadrao[tipo];
    
    let mensagem = `${icone} *${tituloFinal}:*\n`;
    mensagem += `🔗 ${url}\n\n`;
    
    if (descricao) {
      mensagem += `📝 *Descrição:* ${descricao}\n\n`;
    }
    
    // Dicas específicas por tipo
    const dicas = {
      'dashboard': '💡 *Dica:* Clique para acompanhar seu progresso!',
      'documento': '💡 *Dica:* Clique para visualizar o documento!',
      'video': '💡 *Dica:* Clique para assistir o vídeo!',
      'trilha': '💡 *Dica:* Clique para começar a trilha!',
      'quiz': '💡 *Dica:* Clique para fazer o quiz!',
      'slack': '💡 *Dica:* Clique para abrir no Slack!',
      'telegram': '💡 *Dica:* Clique para abrir no Telegram!',
      'pdf': '💡 *Dica:* Clique para baixar o PDF!',
      'youtube': '💡 *Dica:* Clique para assistir no YouTube!',
      'drive': '💡 *Dica:* Clique para abrir no Google Drive!',
      'confluence': '💡 *Dica:* Clique para acessar no Confluence!',
      'notion': '💡 *Dica:* Clique para abrir no Notion!',
      'external': '💡 *Dica:* Clique para abrir o link!'
    };
    
    mensagem += dicas[tipo] || dicas['external'];
    
    return mensagem;
  }

  /**
   * Formata link para Telegram
   */
  formatarTelegram(url, titulo = null, descricao = null) {
    const tipo = this.detectarTipoLink(url);
    const icone = this.icones[tipo];
    const tituloFinal = titulo || this.titulosPadrao[tipo];
    
    let mensagem = `${icone} *${tituloFinal}:*\n\n`;
    mensagem += `[🔗 Abrir Link](${url})\n\n`;
    
    if (descricao) {
      mensagem += `📝 *Descrição:* ${descricao}\n\n`;
    }
    
    // Dicas específicas por tipo
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

  /**
   * Formata link para Chat Flutuante (HTML)
   */
  formatarChatFlutuante(url, titulo = null, descricao = null) {
    const tipo = this.detectarTipoLink(url);
    const icone = this.icones[tipo];
    const tituloFinal = titulo || this.titulosPadrao[tipo];
    
    const corBotao = this.getCorBotao(tipo);
    
    let html = `
      <div class="link-container ${tipo}">
        <button onclick="window.open('${url}', '_blank')" 
                class="link-button ${tipo}" 
                style="background: ${corBotao};">
          ${icone} ${tituloFinal}
        </button>
    `;
    
    if (descricao) {
      html += `<p class="link-description">📝 ${descricao}</p>`;
    }
    
    // Dica específica por tipo
    const dicas = {
      'dashboard': '💡 Clique para acompanhar seu progresso',
      'documento': '💡 Clique para visualizar o documento',
      'video': '💡 Clique para assistir o vídeo',
      'trilha': '💡 Clique para começar a trilha',
      'quiz': '💡 Clique para fazer o quiz',
      'slack': '💡 Clique para abrir no Slack',
      'telegram': '💡 Clique para abrir no Telegram',
      'pdf': '💡 Clique para baixar o PDF',
      'youtube': '💡 Clique para assistir no YouTube',
      'drive': '💡 Clique para abrir no Google Drive',
      'confluence': '💡 Clique para acessar no Confluence',
      'notion': '💡 Clique para abrir no Notion',
      'external': '💡 Clique para abrir o link'
    };
    
    html += `<p class="link-hint">${dicas[tipo] || dicas['external']}</p>`;
    html += `</div>`;
    
    return html;
  }

  /**
   * Formata link para Email (HTML)
   */
  formatarEmail(url, titulo = null, descricao = null) {
    const tipo = this.detectarTipoLink(url);
    const icone = this.icones[tipo];
    const tituloFinal = titulo || this.titulosPadrao[tipo];
    
    const corBotao = this.getCorBotao(tipo);
    
    let html = `
      <div style="text-align: center; margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px;">
        <h3 style="color: #343A40; margin-bottom: 10px;">${icone} ${tituloFinal}</h3>
        <a href="${url}" 
           style="background: ${corBotao}; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; 
                  display: inline-block; font-weight: 500;">
          🔗 Abrir Link
        </a>
    `;
    
    if (descricao) {
      html += `<p style="margin-top: 15px; color: #6C757D; font-size: 14px;">📝 ${descricao}</p>`;
    }
    
    // Dica específica por tipo
    const dicas = {
      'dashboard': '💡 Clique no botão acima para acompanhar seu progresso',
      'documento': '💡 Clique no botão acima para visualizar o documento',
      'video': '💡 Clique no botão acima para assistir o vídeo',
      'trilha': '💡 Clique no botão acima para começar a trilha',
      'quiz': '💡 Clique no botão acima para fazer o quiz',
      'slack': '💡 Clique no botão acima para abrir no Slack',
      'telegram': '💡 Clique no botão acima para abrir no Telegram',
      'pdf': '💡 Clique no botão acima para baixar o PDF',
      'youtube': '💡 Clique no botão acima para assistir no YouTube',
      'drive': '💡 Clique no botão acima para abrir no Google Drive',
      'confluence': '💡 Clique no botão acima para acessar no Confluence',
      'notion': '💡 Clique no botão acima para abrir no Notion',
      'external': '💡 Clique no botão acima para abrir o link'
    };
    
    html += `<p style="margin-top: 10px; color: #6C757D; font-size: 12px;">${dicas[tipo] || dicas['external']}</p>`;
    html += `</div>`;
    
    return html;
  }

  /**
   * Obtém cor do botão baseada no tipo
   */
  getCorBotao(tipo) {
    const cores = {
      'dashboard': '#17A2B8',    // Accent Teal
      'documento': '#6C757D',   // Brand Medium Grey
      'video': '#DC3545',       // Red
      'trilha': '#28A745',      // Success Green
      'quiz': '#FFC107',        // Warning Yellow
      'slack': '#4A154B',       // Slack Purple
      'telegram': '#0088CC',    // Telegram Blue
      'pdf': '#E74C3C',         // Red
      'youtube': '#FF0000',     // YouTube Red
      'drive': '#4285F4',       // Google Blue
      'confluence': '#172B4D',  // Confluence Blue
      'notion': '#000000',      // Notion Black
      'external': '#343A40'     // Brand Dark Grey
    };
    
    return cores[tipo] || cores['external'];
  }

  /**
   * Formata múltiplos links para um canal específico
   */
  formatarMultiplosLinks(links, canal = 'whatsapp') {
    let resultado = '';
    
    links.forEach((link, index) => {
      const { url, titulo, descricao } = link;
      
      switch (canal) {
        case 'whatsapp':
          resultado += this.formatarWhatsApp(url, titulo, descricao);
          break;
        case 'telegram':
          resultado += this.formatarTelegram(url, titulo, descricao);
          break;
        case 'chat':
          resultado += this.formatarChatFlutuante(url, titulo, descricao);
          break;
        case 'email':
          resultado += this.formatarEmail(url, titulo, descricao);
          break;
      }
      
      if (index < links.length - 1) {
        resultado += '\n\n---\n\n';
      }
    });
    
    return resultado;
  }
}

// Exportar para uso em diferentes contextos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LinkFormatter;
} else if (typeof window !== 'undefined') {
  window.LinkFormatter = LinkFormatter;
}

// Exemplo de uso:
/*
const formatter = new LinkFormatter();

// WhatsApp
const whatsappLink = formatter.formatarWhatsApp(
  'https://navigator.com/dashboard', 
  'Painel Pessoal', 
  'Acompanhe seu progresso'
);

// Telegram
const telegramLink = formatter.formatarTelegram(
  'https://youtube.com/watch?v=abc123', 
  'Treinamento LGPD'
);

// Chat Flutuante
const chatLink = formatter.formatarChatFlutuante(
  'https://drive.google.com/file/abc123', 
  'Política de Senhas'
);

// Email
const emailLink = formatter.formatarEmail(
  'https://confluence.empresa.com/politicas', 
  'Confluence - Políticas'
);
*/
