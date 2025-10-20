class ChatWidget {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.isOpen = false;
    this.userId = this.getCurrentUserId();
    this.pageContext = this.getPageContext();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    
    this.init();
  }

  init() {
    this.createWidget();
    this.connectWebSocket();
    this.setupEventListeners();
  }

  createWidget() {
    // Criar HTML do widget - independente do sistema atual
    const widgetHTML = `
      <div class="chat-widget" id="chatWidget">
        <div class="chat-header">
          <div style="display: flex; align-items: center;">
            <div class="chat-avatar" id="chatAvatar">🤖</div>
            <div class="chat-info">
              <h3>Navi</h3>
              <p id="chatStatus" class="chat-status-connecting">Conectando...</p>
            </div>
          </div>
          <button class="chat-toggle" id="chatClose" title="Fechar chat">✕</button>
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
            <input type="text" id="chatInput" placeholder="Digite sua mensagem..." maxlength="500" autocomplete="off">
            <button id="chatSend" disabled title="Enviar mensagem">
              <span>➤</span>
            </button>
          </div>
        </div>
      </div>
      
      <button class="chat-toggle-btn" id="chatToggleBtn" title="Abrir chat com Navi">
        💬
      </button>
    `;

    document.body.insertAdjacentHTML('beforeend', widgetHTML);
    
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
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/chat`;
    
    console.log('🔌 Conectando ao WebSocket:', wsUrl);
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('🔌 WebSocket conectado (Chat Flutuante)');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.status.textContent = 'Online';
      this.status.className = 'chat-status-online';
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
      this.status.className = 'chat-status-offline';
      this.sendBtn.disabled = true;
      this.updateAvatar('offline');
      
      // Tentar reconectar se não foi fechado manualmente
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
        console.log(`🔄 Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts} em ${delay}ms`);
        
        setTimeout(() => {
          if (!this.isConnected) {
            this.connectWebSocket();
          }
        }, delay);
      } else {
        console.log('❌ Máximo de tentativas de reconexão atingido');
        this.status.textContent = 'Erro de conexão';
        this.status.className = 'chat-status-offline';
      }
    };
    
    this.ws.onerror = (error) => {
      console.error('❌ Erro WebSocket:', error);
      this.status.textContent = 'Erro de conexão';
      this.status.className = 'chat-status-offline';
      this.updateAvatar('error');
    };
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
    
    // Auto-resize do input (se fosse textarea)
    this.input.addEventListener('input', () => {
      // Para input de texto simples, não precisa de resize
    });
    
    // Fechar chat com ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeChat();
      }
    });
  }

  openChat() {
    this.widget.classList.add('open');
    this.toggleBtn.classList.add('hidden');
    this.isOpen = true;
    this.input.focus();
    
    // Scroll para baixo
    this.scrollToBottom();
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
    
    // Enviar via WebSocket
    this.ws.send(JSON.stringify({
      type: 'chat',
      userId: this.userId,
      text: text,
      context: this.pageContext
    }));
    
    // Limpar input
    this.input.value = '';
    
    // Mostrar indicador de digitação
    this.showTypingIndicator();
  }

  handleMessage(data) {
    this.hideTypingIndicator();
    
    switch (data.type) {
      case 'response':
        this.addMessage(data.message, 'bot', data.toolsUsed);
        this.updateSentimentIndicator(data.sentiment);
        break;
      case 'error':
        this.addMessage('❌ ' + data.message, 'bot');
        break;
      case 'typing':
        this.showTypingIndicator();
        break;
      default:
        console.log('📨 Mensagem desconhecida:', data);
    }
  }

  addMessage(text, sender, toolsUsed = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';
    bubbleDiv.textContent = text;
    
    messageDiv.appendChild(bubbleDiv);
    
    // Adicionar indicador de ferramentas se usado
    if (toolsUsed && toolsUsed.length > 0) {
      const toolsDiv = document.createElement('div');
      toolsDiv.className = 'message-tools';
      toolsDiv.textContent = `Ferramentas usadas: ${toolsUsed.join(', ')}`;
      messageDiv.appendChild(toolsDiv);
    }
    
    this.messagesContainer.appendChild(messageDiv);
    
    // Scroll para baixo
    this.scrollToBottom();
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
    this.scrollToBottom();
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
      this.avatar.textContent = sentimentEmojis[sentiment];
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

  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  getCurrentUserId() {
    // Buscar userId do localStorage ou da sessão
    // Primeiro tenta localStorage
    let userId = localStorage.getItem('userId');
    
    // Se não encontrar, tenta buscar de elementos da página
    if (!userId) {
      const userIdElement = document.querySelector('[data-user-id]');
      if (userIdElement) {
        userId = userIdElement.getAttribute('data-user-id');
        localStorage.setItem('userId', userId);
      }
    }
    
    // Se ainda não encontrar, usa um ID temporário
    if (!userId) {
      userId = 'anonymous-' + Date.now();
      localStorage.setItem('userId', userId);
    }
    
    return userId;
  }

  getPageContext() {
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard';
    
    const context = {
      page: currentPage,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };
    
    // Adicionar contexto específico da página
    switch (currentPage) {
      case 'colaborador-trilha-detalhes.html':
        const trilhaTitle = document.querySelector('.trilha-title');
        if (trilhaTitle) {
          context.trilha_visualizando = trilhaTitle.textContent;
        }
        break;
        
      case 'colaborador-trilhas.html':
        const trilhas = Array.from(document.querySelectorAll('.trilha-card')).map(card => ({
          nome: card.querySelector('.trilha-nome')?.textContent,
          status: card.querySelector('.trilha-status')?.textContent
        }));
        context.trilhas_disponiveis = trilhas;
        break;
        
      case 'dashboard.html':
        const metrics = {
          colaboradoresAtivos: document.querySelector('.metric-colaboradores')?.textContent,
          trilhasConcluidas: document.querySelector('.metric-trilhas')?.textContent,
          sentimentMedio: document.querySelector('.metric-sentimento')?.textContent
        };
        context.metrics = metrics;
        break;
    }
    
    return context;
  }

  // Método público para abrir o chat programaticamente
  openChatWithMessage(message) {
    this.openChat();
    if (message) {
      this.input.value = message;
      this.input.focus();
    }
  }

  // Método público para fechar o chat programaticamente
  closeChatProgrammatically() {
    this.closeChat();
  }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
  // Verificar se já existe uma instância
  if (!window.chatWidget) {
    window.chatWidget = new ChatWidget();
    console.log('💬 Chat Widget inicializado');
  }
});

// Exportar para uso global
window.ChatWidget = ChatWidget;
