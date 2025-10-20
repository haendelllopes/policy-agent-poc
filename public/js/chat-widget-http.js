// Chat Widget HTTP - Versão com Botão Flutuante Garantido
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
    this.createFloatingButton();
    this.createChatWindow();
    this.setupEventListeners();
    console.log('✅ Chat Widget HTTP inicializado com sucesso!');
  }

  createFloatingButton() {
    console.log('🔘 Criando botão flutuante...');
    
    // Criar botão flutuante super visível
    const floatingButton = document.createElement('div');
    floatingButton.id = 'navi-floating-button';
    floatingButton.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #17A2B8, #138496);
        border-radius: 50%;
        box-shadow: 0 4px 20px rgba(23, 162, 184, 0.4);
        cursor: pointer;
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: white;
        transition: all 0.3s ease;
        border: 3px solid white;
      " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
        🤖
      </div>
    `;

    document.body.appendChild(floatingButton);
    console.log('🔘 Botão flutuante criado e adicionado ao DOM');
  }

  createChatWindow() {
    console.log('💬 Criando janela do chat...');
    
    // Criar janela do chat
    const chatWindow = document.createElement('div');
    chatWindow.id = 'navi-chat-window';
    chatWindow.innerHTML = `
      <div style="
        position: fixed;
        bottom: 90px;
        right: 20px;
        width: 350px;
        height: 500px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        z-index: 999998;
        display: none;
        flex-direction: column;
        font-family: 'Montserrat', 'Roboto', sans-serif;
        border: 1px solid #e9ecef;
        overflow: hidden;
      ">
        <div style="
          background: linear-gradient(135deg, #17A2B8, #138496);
          color: white;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        ">
          <div style="display: flex; align-items: center;">
            <span style="font-size: 20px; margin-right: 8px;">🤖</span>
            <span style="font-weight: 600;">Navi</span>
            <span id="navi-status" style="margin-left: 8px;">🟢</span>
          </div>
          <button id="navi-close-chat" style="
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 20px;
            padding: 4px;
          ">✕</button>
        </div>
        
        <div id="navi-chat-body" style="flex: 1; display: flex; flex-direction: column;">
          <div id="navi-chat-messages" style="
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            background: #f8f9fa;
          ">
            <div style="margin-bottom: 16px;">
              <div style="display: flex; align-items: flex-start;">
                <div style="
                  width: 32px;
                  height: 32px;
                  background: #17A2B8;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  margin-right: 12px;
                  font-size: 16px;
                ">🤖</div>
                <div style="
                  background: white;
                  padding: 12px;
                  border-radius: 12px;
                  max-width: 80%;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                ">
                  Olá! Sou o Navi, seu assistente de onboarding. Como posso ajudar você hoje?
                </div>
              </div>
            </div>
          </div>
          
          <div style="
            padding: 16px;
            border-top: 1px solid #e9ecef;
            background: white;
          ">
            <div style="display: flex; gap: 8px;">
              <input type="text" id="navi-chat-input" placeholder="Digite sua mensagem..." style="
                flex: 1;
                padding: 12px;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                outline: none;
                font-size: 14px;
              ">
              <button id="navi-chat-send" style="
                background: #17A2B8;
                color: white;
                border: none;
                padding: 12px 16px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
              ">📤</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(chatWindow);
    console.log('💬 Janela do chat criada e adicionada ao DOM');
  }

  setupEventListeners() {
    console.log('🎧 Configurando event listeners...');
    
    // Botão flutuante
    const floatingButton = document.getElementById('navi-floating-button');
    if (floatingButton) {
      floatingButton.addEventListener('click', () => this.openChat());
      console.log('✅ Event listener do botão flutuante configurado');
    }

    // Botão fechar
    const closeButton = document.getElementById('navi-close-chat');
    if (closeButton) {
      closeButton.addEventListener('click', () => this.closeChat());
      console.log('✅ Event listener do botão fechar configurado');
    }

    // Botão enviar
    const sendButton = document.getElementById('navi-chat-send');
    if (sendButton) {
      sendButton.addEventListener('click', () => this.sendMessage());
      console.log('✅ Event listener do botão enviar configurado');
    }

    // Input
    const input = document.getElementById('navi-chat-input');
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

  openChat() {
    console.log('🔄 Abrindo chat...');
    const chatWindow = document.getElementById('navi-chat-window');
    if (chatWindow) {
      chatWindow.style.display = 'flex';
      this.isOpen = true;
      
      // Focar no input
      const input = document.getElementById('navi-chat-input');
      if (input) {
        setTimeout(() => input.focus(), 100);
      }
      
      console.log('✅ Chat aberto');
    }
  }

  closeChat() {
    console.log('🔄 Fechando chat...');
    const chatWindow = document.getElementById('navi-chat-window');
    if (chatWindow) {
      chatWindow.style.display = 'none';
      this.isOpen = false;
      console.log('✅ Chat fechado');
    }
  }

  async sendMessage() {
    const input = document.getElementById('navi-chat-input');
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
    const messagesContainer = document.getElementById('navi-chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.style.marginBottom = '16px';
    
    const avatar = sender === 'navi' ? '🤖' : '👤';
    const bgColor = sender === 'navi' ? 'white' : '#17A2B8';
    const textColor = sender === 'navi' ? '#000' : '#fff';
    const flexDirection = sender === 'user' ? 'flex-direction: row-reverse;' : '';
    
    messageDiv.innerHTML = `
      <div style="display: flex; align-items: flex-start; ${flexDirection}">
        <div style="
          width: 32px;
          height: 32px;
          background: ${sender === 'navi' ? '#17A2B8' : '#6c757d'};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          font-size: 16px;
        ">${avatar}</div>
        <div style="
          background: ${bgColor};
          color: ${textColor};
          padding: 12px;
          border-radius: 12px;
          max-width: 80%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        ">
          ${text}
        </div>
      </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  showLoading() {
    this.isLoading = true;
    const messagesContainer = document.getElementById('navi-chat-messages');
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'navi-loading-message';
    loadingDiv.style.marginBottom = '16px';
    loadingDiv.innerHTML = `
      <div style="display: flex; align-items: flex-start;">
        <div style="
          width: 32px;
          height: 32px;
          background: #17A2B8;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          font-size: 16px;
        ">🤖</div>
        <div style="
          background: white;
          padding: 12px;
          border-radius: 12px;
          max-width: 80%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        ">
          <div style="display: flex; gap: 4px;">
            <span style="width: 8px; height: 8px; background: #17A2B8; border-radius: 50%; animation: pulse 1.4s infinite;"></span>
            <span style="width: 8px; height: 8px; background: #17A2B8; border-radius: 50%; animation: pulse 1.4s infinite 0.2s;"></span>
            <span style="width: 8px; height: 8px; background: #17A2B8; border-radius: 50%; animation: pulse 1.4s infinite 0.4s;"></span>
          </div>
        </div>
      </div>
    `;
    messagesContainer.appendChild(loadingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  hideLoading() {
    this.isLoading = false;
    const loadingDiv = document.getElementById('navi-loading-message');
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

// Adicionar CSS para animação
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
  }
`;
document.head.appendChild(style);

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