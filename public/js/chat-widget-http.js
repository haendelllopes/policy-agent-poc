// Chat Widget HTTP - Versão Simplificada para Debug
console.log('🚀 Carregando Chat Widget HTTP...');

class ChatWidgetHTTP {
  constructor() {
    console.log('🔧 Iniciando construtor ChatWidgetHTTP...');
    this.isOpen = false;
    this.messages = [];
    this.isLoading = false;
    this.currentUserId = null;
    this.currentContext = null;
    
    this.init();
  }

  init() {
    console.log('🎯 Inicializando chat widget...');
    this.createWidget();
    this.setupEventListeners();
    console.log('✅ Chat Widget HTTP inicializado com sucesso!');
  }

  createWidget() {
    console.log('📦 Criando HTML do chat widget...');
    
    // Criar container do chat
    const chatContainer = document.createElement('div');
    chatContainer.id = 'chat-widget-container';
    chatContainer.innerHTML = `
      <div id="chat-widget" class="chat-widget" style="position: fixed; bottom: 20px; right: 20px; width: 350px; height: 500px; background: white; border-radius: 12px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1); z-index: 10000; display: flex; flex-direction: column; font-family: 'Montserrat', 'Roboto', sans-serif; border: 1px solid #e9ecef;">
        <div class="chat-header" style="background: linear-gradient(135deg, #17A2B8, #138496); color: white; padding: 16px; border-radius: 12px 12px 0 0; display: flex; align-items: center; justify-content: space-between;">
          <div class="chat-title" style="display: flex; align-items: center;">
            <span class="navi-icon" style="font-size: 20px; margin-right: 8px;">🤖</span>
            <span class="navi-name" style="font-weight: 600;">Navi</span>
            <span class="navi-status" id="navi-status" style="margin-left: 8px;">🟢</span>
          </div>
          <button class="chat-toggle" id="chat-toggle" style="background: none; border: none; color: white; cursor: pointer; font-size: 20px;">
            💬
          </button>
        </div>
        
        <div class="chat-body" id="chat-body" style="flex: 1; display: none; flex-direction: column;">
          <div class="chat-messages" id="chat-messages" style="flex: 1; padding: 16px; overflow-y: auto;">
            <div class="message navi-message" style="margin-bottom: 16px;">
              <div class="message-content" style="display: flex; align-items: flex-start;">
                <div class="message-avatar" style="width: 32px; height: 32px; background: #17A2B8; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 16px;">🤖</div>
                <div class="message-text" style="background: #f8f9fa; padding: 12px; border-radius: 12px; max-width: 80%;">
                  Olá! Sou o Navi, seu assistente de onboarding. Como posso ajudar você hoje?
                </div>
              </div>
            </div>
          </div>
          
          <div class="chat-input-container" style="padding: 16px; border-top: 1px solid #e9ecef;">
            <div class="chat-input-wrapper" style="display: flex; gap: 8px;">
              <input type="text" id="chat-input" placeholder="Digite sua mensagem..." style="flex: 1; padding: 12px; border: 1px solid #e9ecef; border-radius: 8px; outline: none;">
              <button id="chat-send" style="background: #17A2B8; color: white; border: none; padding: 12px 16px; border-radius: 8px; cursor: pointer;">
                📤
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(chatContainer);
    console.log('📦 Chat widget HTML criado e adicionado ao DOM');
  }

  setupEventListeners() {
    console.log('🎧 Configurando event listeners...');
    const toggle = document.getElementById('chat-toggle');
    const sendButton = document.getElementById('chat-send');
    const input = document.getElementById('chat-input');

    if (toggle) {
      toggle.addEventListener('click', () => this.toggleChat());
      console.log('✅ Event listener do toggle configurado');
    } else {
      console.error('❌ Botão toggle não encontrado!');
    }

    if (sendButton) {
      sendButton.addEventListener('click', () => this.sendMessage());
      console.log('✅ Event listener do send configurado');
    }

    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
      console.log('✅ Event listener do input configurado');
    }
  }

  toggleChat() {
    console.log('🔄 Alternando estado do chat...');
    const chatBody = document.getElementById('chat-body');
    const chatWidget = document.getElementById('chat-widget');
    
    this.isOpen = !this.isOpen;
    
    if (this.isOpen) {
      chatBody.style.display = 'flex';
      chatWidget.style.transform = 'translateY(0)';
      document.getElementById('chat-input').focus();
      console.log('✅ Chat aberto');
    } else {
      chatBody.style.display = 'none';
      chatWidget.style.transform = 'translateY(100%)';
      console.log('✅ Chat fechado');
    }
  }

  async sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message || this.isLoading) return;

    console.log('📤 Enviando mensagem:', message);
    
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
      
      console.log('✅ Resposta recebida:', data.message);
      
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      this.addMessage('Desculpe, ocorreu um erro. Tente novamente em alguns instantes.', 'navi');
    } finally {
      this.hideLoading();
    }
  }

  addMessage(text, sender) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    messageDiv.style.marginBottom = '16px';
    
    const avatar = sender === 'navi' ? '🤖' : '👤';
    const bgColor = sender === 'navi' ? '#f8f9fa' : '#17A2B8';
    const textColor = sender === 'navi' ? '#000' : '#fff';
    
    messageDiv.innerHTML = `
      <div class="message-content" style="display: flex; align-items: flex-start; ${sender === 'user' ? 'flex-direction: row-reverse;' : ''}">
        <div class="message-avatar" style="width: 32px; height: 32px; background: ${sender === 'navi' ? '#17A2B8' : '#6c757d'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 16px;">${avatar}</div>
        <div class="message-text" style="background: ${bgColor}; color: ${textColor}; padding: 12px; border-radius: 12px; max-width: 80%;">
          ${text}
        </div>
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
      <div class="message-content" style="display: flex; align-items: flex-start;">
        <div class="message-avatar" style="width: 32px; height: 32px; background: #17A2B8; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 16px;">🤖</div>
        <div class="message-text" style="background: #f8f9fa; padding: 12px; border-radius: 12px; max-width: 80%;">
          <div class="typing-indicator" style="display: flex; gap: 4px;">
            <span style="width: 8px; height: 8px; background: #17A2B8; border-radius: 50%; animation: typing 1.4s infinite;"></span>
            <span style="width: 8px; height: 8px; background: #17A2B8; border-radius: 50%; animation: typing 1.4s infinite 0.2s;"></span>
            <span style="width: 8px; height: 8px; background: #17A2B8; border-radius: 50%; animation: typing 1.4s infinite 0.4s;"></span>
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

  setUserId(userId) {
    this.currentUserId = userId;
    console.log('👤 User ID definido:', userId);
  }

  setContext(context) {
    this.currentContext = context;
    console.log('🎯 Contexto definido:', context);
  }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 DOM carregado, inicializando Chat Widget HTTP...');
  try {
    window.chatWidgetHTTP = new ChatWidgetHTTP();
    console.log('✅ Chat Widget HTTP inicializado globalmente!');
  } catch (error) {
    console.error('❌ Erro ao inicializar Chat Widget HTTP:', error);
  }
});

console.log('📄 Script chat-widget-http.js carregado');