class ChatWidget {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.isOpen = false;
    this.userId = this.getCurrentUserId();
    this.pageContext = this.getPageContext();
    
    this.init();
  }

  init() {
    this.createWidget();
    this.connectWebSocket();
    this.setupEventListeners();
  }

  createWidget() {
    // Criar HTML do widget - Brand Manual Navi
    const widgetHTML = `
      <div class="chat-widget" id="chatWidget">
        <div class="chat-header">
          <div style="display: flex; align-items: center;">
            <div class="chat-avatar" id="chatAvatar">
              <i data-feather="message-circle" class="chat-icon"></i>
            </div>
            <div class="chat-info">
              <h3>Navi</h3>
              <p id="chatStatus">Conectando...</p>
            </div>
          </div>
          <button class="chat-toggle" id="chatClose">
            <i data-feather="x" class="chat-toggle-icon"></i>
          </button>
        </div>
        <div class="chat-messages" id="chatMessages">
          <div class="message bot">
            <div class="message-bubble">
              Olá! 👋 Sou o Navi, seu assistente de onboarding. Como posso te ajudar hoje?
            </div>
          </div>
        </div>
        <div class="chat-input-container">
          <div class="chat-input">
            <input type="text" id="chatInput" placeholder="Digite sua mensagem..." maxlength="500">
            <button id="chatSend" disabled>
              <i data-feather="send" class="send-icon"></i>
            </button>
          </div>
        </div>
      </div>
      
      <button class="chat-toggle-btn" id="chatToggleBtn">
        <i data-feather="message-circle"></i>
      </button>
    `;

    document.body.insertAdjacentHTML('beforeend', widgetHTML);
    
    // Inicializar Feather Icons
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
    
    // Referências aos elementos
    this.widget = document.getElementById('chatWidget');
    this.toggleBtn = document.getElementById('chatToggleBtn');
    this.closeBtn = document.getElementById('chatClose');
    this.messagesContainer = document.getElementById('chatMessages');
    this.input = document.getElementById('chatInput');
    this.sendBtn = document.getElementById('chatSend');
    this.status = document.getElementById('chatStatus');
    this.avatar = document.getElementById('chatAvatar');
  }

  connectWebSocket() {
    // Detectar se está em desenvolvimento local
    const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isLocalDev) {
      // Desenvolvimento local - usar WebSocket
      this.connectWebSocketLocal();
    } else {
      // Produção - usar HTTP polling (Vercel não suporta WebSockets)
      this.connectHttpMode();
    }
  }

  connectWebSocketLocal() {
    const wsUrl = 'ws://localhost:3000/ws/chat';
    console.log('🔌 Conectando WebSocket local:', wsUrl);
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('🔌 WebSocket conectado (Chat Flutuante)');
      this.isConnected = true;
      this.status.textContent = 'Online';
      this.sendBtn.disabled = false;
      this.updateAvatar('online');
    };
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };
    
    this.ws.onclose = () => {
      console.log('🔌 WebSocket desconectado');
      this.isConnected = false;
      this.status.textContent = 'Desconectado';
      this.sendBtn.disabled = true;
      this.updateAvatar('offline');
      
      // Tentar reconectar após 3 segundos
      setTimeout(() => {
        if (!this.isConnected) {
          this.connectWebSocketLocal();
        }
      }, 3000);
    };
    
    this.ws.onerror = (error) => {
      console.error('❌ Erro WebSocket:', error);
      this.isConnected = false;
      this.status.textContent = 'Erro de conexão';
      this.sendBtn.disabled = true;
      this.updateAvatar('error');
    };
  }

  connectHttpMode() {
    console.log('🌐 Modo HTTP ativado (Produção)');
    this.isConnected = true;
    this.status.textContent = 'Online (HTTP)';
    this.sendBtn.disabled = false;
    this.updateAvatar('online');
    this.httpMode = true;
  }

  setupEventListeners() {
    // Toggle do widget
    this.toggleBtn.addEventListener('click', () => {
      this.openChat();
    });
    
    this.closeBtn.addEventListener('click', () => {
      this.closeChat();
    });
    
    // Envio de mensagem
    this.sendBtn.addEventListener('click', () => {
      this.sendMessage();
    });
    
    this.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    
    // Auto-resize do input
    this.input.addEventListener('input', () => {
      this.input.style.height = 'auto';
      this.input.style.height = this.input.scrollHeight + 'px';
    });
  }

  openChat() {
    this.widget.classList.add('open');
    this.toggleBtn.classList.add('hidden');
    this.isOpen = true;
    this.input.focus();
  }

  closeChat() {
    this.widget.classList.remove('open');
    this.toggleBtn.classList.remove('hidden');
    this.isOpen = false;
  }

  sendMessage() {
    const text = this.input.value.trim();
    if (!text || !this.isConnected) return;
    
    // Adicionar mensagem do usuário
    this.addMessage(text, 'user');
    
    if (this.httpMode) {
      // Modo HTTP (Produção)
      this.sendMessageHttp(text);
    } else {
      // Modo WebSocket (Desenvolvimento)
      this.ws.send(JSON.stringify({
        type: 'chat',
        userId: this.userId,
        text: text,
        context: this.pageContext
      }));
    }
    
    // Limpar input
    this.input.value = '';
    this.input.style.height = 'auto';
    
    // Mostrar indicador de digitação
    this.showTypingIndicator();
  }

  async sendMessageHttp(text) {
    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.userId,
          text: text,
          context: this.pageContext
        })
      });

      if (response.ok) {
        const data = await response.json();
        this.handleMessage(data);
      } else {
        this.handleMessage({
          type: 'error',
          message: 'Erro ao enviar mensagem'
        });
      }
    } catch (error) {
      console.error('❌ Erro HTTP:', error);
      this.handleMessage({
        type: 'error',
        message: 'Erro de conexão'
      });
    }
  }

  handleMessage(data) {
    this.hideTypingIndicator();
    
    switch (data.type) {
      case 'response':
        this.addMessage(data.message || 'Resposta recebida', 'bot', {
          sentiment: data.sentiment,
          toolsUsed: data.toolsUsed
        });
        this.updateSentimentIndicator(data.sentiment);
        break;
      case 'error':
        this.addMessage('❌ ' + data.message, 'bot');
        break;
      case 'typing':
        this.showTypingIndicator();
        break;
    }
  }

  addMessage(text, sender, metadata = {}) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';
    
    // Detectar se é texto longo (tratar null/undefined)
    if (text && text.length > 200) {
      bubbleDiv.classList.add('long-text');
    }
    
    // Formatar o texto
    bubbleDiv.innerHTML = this.formatMessage(text);
    
    messageDiv.appendChild(bubbleDiv);
    
    // Adicionar ferramentas utilizadas se disponível
    if (metadata.toolsUsed && metadata.toolsUsed.length > 0) {
      const toolsDiv = document.createElement('div');
      toolsDiv.className = 'tools-used';
      toolsDiv.innerHTML = `
        <div class="tools-used-title">🔧 Ferramentas utilizadas:</div>
        ${metadata.toolsUsed.map(tool => `<span class="tool-item">${tool.tool}</span>`).join('')}
      `;
      messageDiv.appendChild(toolsDiv);
    }
    
    // Adicionar indicador de sentimento se disponível
    if (metadata.sentiment && metadata.sentiment !== 'neutro') {
      const sentimentDiv = document.createElement('div');
      sentimentDiv.className = `sentiment-indicator sentiment-${metadata.sentiment.includes('positivo') ? 'positive' : 'negative'}`;
      sentimentDiv.textContent = `Sentimento: ${metadata.sentiment}`;
      messageDiv.appendChild(sentimentDiv);
    }
    
    this.messagesContainer.appendChild(messageDiv);
    
    // Scroll para baixo
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  formatMessage(text) {
    // Tratar valores null/undefined
    if (!text) {
      return '<em>Mensagem vazia</em>';
    }
    
    // Converter quebras de linha para <br>
    let formatted = text.replace(/\n/g, '<br>');
    
    // Formatar listas com marcadores
    formatted = formatted.replace(/^[\s]*[-•]\s+(.+)$/gm, '<li>$1</li>');
    formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Formatar listas numeradas
    formatted = formatted.replace(/^[\s]*\d+\.\s+(.+)$/gm, '<li>$1</li>');
    formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>');
    
    // Formatar texto em negrito
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Formatar texto em itálico
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Formatar código inline
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Formatar blocos de código
    formatted = formatted.replace(/```([^`]+)```/g, '<pre>$1</pre>');
    
    // Formatar links
    formatted = formatted.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
    
    // Formatar títulos
    formatted = formatted.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    formatted = formatted.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    formatted = formatted.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    
    // Formatar citações
    formatted = formatted.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
    
    return formatted;
  }

  showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot typing-indicator';
    typingDiv.innerHTML = `
      <div class="message-bubble">
        <span class="typing-dots">
          <span></span><span></span><span></span>
        </span>
      </div>
    `;
    
    this.messagesContainer.appendChild(typingDiv);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  hideTypingIndicator() {
    const typingIndicator = this.messagesContainer.querySelector('.typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  updateSentimentIndicator(sentiment) {
    const sentimentEmojis = {
      'muito_positivo': '😍',
      'positivo': '😊',
      'neutro': '😐',
      'negativo': '😔',
      'muito_negativo': '😡'
    };
    
    if (sentiment && sentimentEmojis[sentiment]) {
      // Manter ícone Feather mesmo com sentimento
      this.refreshFeatherIcons();
    }
  }

  refreshFeatherIcons() {
    // Re-inicializar Feather Icons após mudanças no DOM
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  }

  updateAvatar(status) {
    const statusEmojis = {
      'online': '🤖',
      'offline': '😴',
      'error': '❌'
    };
    
    this.avatar.textContent = statusEmojis[status] || '🤖';
  }

  getCurrentUserId() {
    // Buscar userId do localStorage ou da sessão
    return localStorage.getItem('userId') || 'anonymous';
  }

  getPageContext() {
    return {
      page: window.location.pathname.split('/').pop() || 'dashboard',
      url: window.location.href,
      timestamp: new Date().toISOString()
    };
  }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
  new ChatWidget();
});