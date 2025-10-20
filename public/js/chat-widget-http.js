// Chat Widget usando HTTP em vez de WebSocket (compatível com Vercel)
class ChatWidgetHTTP {
  constructor() {
    this.isOpen = false;
    this.messages = [];
    this.isLoading = false;
    this.pollingInterval = null;
    this.currentUserId = null;
    this.currentContext = null;
    this.messageQueue = [];
    
    this.init();
  }

  init() {
    this.createWidget();
    this.setupEventListeners();
    console.log('💬 Chat Widget HTTP inicializado');
  }

  createWidget() {
    // Criar container do chat
    const chatContainer = document.createElement('div');
    chatContainer.id = 'chat-widget-container';
    chatContainer.innerHTML = `
      <div id="chat-widget" class="chat-widget">
        <div class="chat-header">
          <div class="chat-title">
            <span class="navi-icon">🤖</span>
            <span class="navi-name">Navi</span>
            <span class="navi-status" id="navi-status">●</span>
          </div>
          <button class="chat-toggle" id="chat-toggle">
            <i data-feather="message-circle"></i>
          </button>
        </div>
        
        <div class="chat-body" id="chat-body">
          <div class="chat-messages" id="chat-messages">
            <div class="message navi-message">
              <div class="message-content">
                <div class="message-avatar">🤖</div>
                <div class="message-text">
                  Olá! Sou o Navi, seu assistente de onboarding. Como posso ajudar você hoje?
                </div>
              </div>
            </div>
          </div>
          
          <div class="chat-input-container">
            <div class="chat-input-wrapper">
              <input type="text" id="chat-input" placeholder="Digite sua mensagem..." disabled>
              <button id="chat-send" disabled>
                <i data-feather="send"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(chatContainer);
    
    // Inicializar Feather Icons
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  }

  setupEventListeners() {
    const toggle = document.getElementById('chat-toggle');
    const sendButton = document.getElementById('chat-send');
    const input = document.getElementById('chat-input');

    toggle.addEventListener('click', () => this.toggleChat());
    sendButton.addEventListener('click', () => this.sendMessage());
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
  }

  toggleChat() {
    const chatBody = document.getElementById('chat-body');
    const chatWidget = document.getElementById('chat-widget');
    
    this.isOpen = !this.isOpen;
    
    if (this.isOpen) {
      chatBody.style.display = 'block';
      chatWidget.classList.add('open');
      document.getElementById('chat-input').focus();
      this.enableInput();
    } else {
      chatBody.style.display = 'none';
      chatWidget.classList.remove('open');
    }
  }

  enableInput() {
    document.getElementById('chat-input').disabled = false;
    document.getElementById('chat-send').disabled = false;
  }

  async sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message || this.isLoading) return;

    // Adicionar mensagem do usuário
    this.addMessage(message, 'user');
    input.value = '';
    
    // Mostrar loading
    this.showLoading();
    
    try {
      // Enviar mensagem via HTTP
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          userId: this.currentUserId || 'demo-user',
          context: this.currentContext || {}
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Adicionar resposta do Navi
      this.addMessage(data.message, 'navi');
      
      // Atualizar status
      this.updateStatus('online');
      
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      this.addMessage('Desculpe, ocorreu um erro. Tente novamente em alguns instantes.', 'navi');
      this.updateStatus('error');
    } finally {
      this.hideLoading();
    }
  }

  addMessage(text, sender) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const avatar = sender === 'navi' ? '🤖' : '👤';
    
    messageDiv.innerHTML = `
      <div class="message-content">
        <div class="message-avatar">${avatar}</div>
        <div class="message-text">${text}</div>
      </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  showLoading() {
    this.isLoading = true;
    const messagesContainer = document.getElementById('chat-messages');
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-message';
    loadingDiv.className = 'message navi-message loading';
    loadingDiv.innerHTML = `
      <div class="message-content">
        <div class="message-avatar">🤖</div>
        <div class="message-text">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    `;
    messagesContainer.appendChild(loadingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  hideLoading() {
    this.isLoading = false;
    const loadingDiv = document.getElementById('loading-message');
    if (loadingDiv) {
      loadingDiv.remove();
    }
  }

  updateStatus(status) {
    const statusElement = document.getElementById('navi-status');
    const statusMap = {
      online: '🟢',
      offline: '🔴',
      error: '🟡'
    };
    statusElement.textContent = statusMap[status] || '●';
  }

  setUserId(userId) {
    this.currentUserId = userId;
  }

  setContext(context) {
    this.currentContext = context;
  }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  window.chatWidgetHTTP = new ChatWidgetHTTP();
});
