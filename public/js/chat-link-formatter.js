/**
 * Sistema de Formatação de Links para Chat Flutuante
 * 
 * Implementa formatação rica de links com botões HTML interativos
 * para o chat flutuante WebSocket.
 */

// ===================================================================
// SISTEMA DE FORMATAÇÃO DE LINKS PARA CHAT FLUTUANTE
// ===================================================================

class ChatFlutuanteLinkFormatter {
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
    
    this.cores = {
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
    const cor = this.cores[tipo];
    const tituloFinal = titulo || this.getTituloPadrao(tipo);
    
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
    
    const dica = dicas[tipo] || dicas['external'];
    
    return `
      <div class="link-container ${tipo}" style="margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid ${cor};">
        <div class="link-header" style="display: flex; align-items: center; margin-bottom: 10px;">
          <span class="link-icon" style="font-size: 24px; margin-right: 10px;">${icone}</span>
          <h4 class="link-title" style="margin: 0; color: #343A40; font-size: 16px; font-weight: 600;">${tituloFinal}</h4>
        </div>
        
        ${descricao ? `
          <p class="link-description" style="margin: 8px 0; color: #6C757D; font-size: 14px; line-height: 1.4;">
            📝 ${descricao}
          </p>
        ` : ''}
        
        <button onclick="window.open('${url}', '_blank')" 
                class="link-button ${tipo}" 
                style="background: ${cor}; color: white; border: none; padding: 10px 20px; 
                       border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; 
                       transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)'"
                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'">
          🔗 Abrir Link
        </button>
        
        <p class="link-hint" style="margin: 8px 0 0 0; color: #6C757D; font-size: 12px; font-style: italic;">
          ${dica}
        </p>
      </div>
    `;
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

  // Formatar múltiplos links
  formatarMultiplosLinks(links) {
    let html = '<div class="links-container" style="margin: 20px 0;">';
    
    links.forEach((link, index) => {
      const { url, titulo, descricao } = link;
      html += this.formatarLink(url, titulo, descricao);
      
      if (index < links.length - 1) {
        html += '<hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">';
      }
    });
    
    html += '</div>';
    return html;
  }

  // Formatar link compacto (para mensagens menores)
  formatarLinkCompacto(url, titulo = null) {
    const tipo = this.detectarTipoLink(url);
    const icone = this.icones[tipo];
    const cor = this.cores[tipo];
    const tituloFinal = titulo || this.getTituloPadrao(tipo);
    
    return `
      <div class="link-compacto ${tipo}" style="display: inline-block; margin: 5px 0;">
        <button onclick="window.open('${url}', '_blank')" 
                class="link-button-compacto ${tipo}" 
                style="background: ${cor}; color: white; border: none; padding: 6px 12px; 
                       border-radius: 4px; font-size: 12px; font-weight: 500; cursor: pointer; 
                       transition: all 0.2s ease;"
                onmouseover="this.style.opacity='0.9'"
                onmouseout="this.style.opacity='1'">
          ${icone} ${tituloFinal}
        </button>
      </div>
    `;
  }
}

// ===================================================================
// INTEGRAÇÃO COM CHAT FLUTUANTE
// ===================================================================

// Instanciar o formatador globalmente
window.chatLinkFormatter = new ChatFlutuanteLinkFormatter();

// Função para processar mensagens com links
function processarMensagemComLinks(mensagem) {
  // Detectar URLs na mensagem
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = mensagem.match(urlRegex);
  
  if (!urls || urls.length === 0) {
    return mensagem; // Retorna mensagem original se não há URLs
  }
  
  let mensagemProcessada = mensagem;
  
  // Processar cada URL encontrada
  urls.forEach(url => {
    const linkFormatado = window.chatLinkFormatter.formatarLink(url);
    mensagemProcessada = mensagemProcessada.replace(url, linkFormatado);
  });
  
  return mensagemProcessada;
}

// Função para adicionar links específicos
function adicionarLinkFormatado(url, titulo = null, descricao = null) {
  return window.chatLinkFormatter.formatarLink(url, titulo, descricao);
}

// Função para adicionar múltiplos links
function adicionarMultiplosLinks(links) {
  return window.chatLinkFormatter.formatarMultiplosLinks(links);
}

// Função para adicionar link compacto
function adicionarLinkCompacto(url, titulo = null) {
  return window.chatLinkFormatter.formatarLinkCompacto(url, titulo);
}

// ===================================================================
// EXEMPLOS DE USO NO CHAT FLUTUANTE
// ===================================================================

/*
// Exemplo 1: Processar mensagem com URLs automáticas
const mensagemOriginal = "Acesse seu dashboard: https://navigator.com/dashboard e também este documento: https://drive.google.com/file/abc123";
const mensagemFormatada = processarMensagemComLinks(mensagemOriginal);

// Exemplo 2: Adicionar link específico
const linkDashboard = adicionarLinkFormatado(
  'https://navigator.com/dashboard',
  'Painel Pessoal',
  'Acompanhe seu progresso'
);

// Exemplo 3: Adicionar múltiplos links
const links = [
  { url: 'https://navigator.com/dashboard', titulo: 'Painel Pessoal', descricao: 'Acompanhe seu progresso' },
  { url: 'https://drive.google.com/file/abc123', titulo: 'Política de Senhas', descricao: 'Documento obrigatório' },
  { url: 'https://youtube.com/watch?v=xyz', titulo: 'Treinamento LGPD', descricao: 'Vídeo explicativo' }
];
const linksFormatados = adicionarMultiplosLinks(links);

// Exemplo 4: Adicionar link compacto
const linkCompacto = adicionarLinkCompacto('https://navigator.com/dashboard', 'Dashboard');
*/

// ===================================================================
// INTEGRAÇÃO COM WEBSOCKET
// ===================================================================

// Função para processar mensagens recebidas via WebSocket
function processarMensagemWebSocket(mensagem) {
  // Verificar se a mensagem contém dados de links
  if (mensagem.dashboard_url || mensagem.links || mensagem.url) {
    let mensagemFormatada = mensagem.text || mensagem.message || '';
    
    // Adicionar link do dashboard se disponível
    if (mensagem.dashboard_url) {
      mensagemFormatada += adicionarLinkFormatado(
        mensagem.dashboard_url,
        'Painel Pessoal',
        'Acompanhe seu progresso'
      );
    }
    
    // Adicionar links específicos se disponíveis
    if (mensagem.links && Array.isArray(mensagem.links)) {
      mensagemFormatada += adicionarMultiplosLinks(mensagem.links);
    }
    
    // Adicionar link único se disponível
    if (mensagem.url && !mensagem.dashboard_url) {
      mensagemFormatada += adicionarLinkFormatado(
        mensagem.url,
        mensagem.titulo || null,
        mensagem.descricao || null
      );
    }
    
    return mensagemFormatada;
  }
  
  // Processar URLs automáticas na mensagem
  return processarMensagemComLinks(mensagem.text || mensagem.message || '');
}

// Exportar funções para uso global
window.processarMensagemComLinks = processarMensagemComLinks;
window.adicionarLinkFormatado = adicionarLinkFormatado;
window.adicionarMultiplosLinks = adicionarMultiplosLinks;
window.adicionarLinkCompacto = adicionarLinkCompacto;
window.processarMensagemWebSocket = processarMensagemWebSocket;
