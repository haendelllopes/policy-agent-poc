// Chat Widget HTTP - Versão com Estilos Aplicados via JavaScript
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
    
    // Criar botão flutuante
    const floatingButton = document.createElement('div');
    floatingButton.id = 'navi-floating-button';
    
    // Aplicar estilos via JavaScript
    const buttonStyle = {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '60px',
      height: '60px',
      background: 'linear-gradient(135deg, #17A2B8, #138496)',
      borderRadius: '50%',
      boxShadow: '0 4px 20px rgba(23, 162, 184, 0.4)',
      cursor: 'pointer',
      zIndex: '999999',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      color: 'white',
      transition: 'all 0.3s ease',
      border: '3px solid white'
    };
    
    Object.assign(floatingButton.style, buttonStyle);
    floatingButton.innerHTML = '🤖';
    
    // Adicionar hover effect
    floatingButton.addEventListener('mouseenter', () => {
      floatingButton.style.transform = 'scale(1.1)';
    });
    floatingButton.addEventListener('mouseleave', () => {
      floatingButton.style.transform = 'scale(1)';
    });

    document.body.appendChild(floatingButton);
    console.log('🔘 Botão flutuante criado e adicionado ao DOM');
  }

  createChatWindow() {
    console.log('💬 Criando janela do chat...');
    
    // Criar janela do chat
    const chatWindow = document.createElement('div');
    chatWindow.id = 'navi-chat-window';
    
    // Aplicar estilos via JavaScript
    const windowStyle = {
      position: 'fixed',
      bottom: '90px',
      right: '20px',
      width: '350px',
      height: '500px',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
      zIndex: '999998',
      display: 'none',
      flexDirection: 'column',
      fontFamily: "'Montserrat', 'Roboto', sans-serif",
      border: '1px solid #e9ecef',
      overflow: 'hidden'
    };
    
    Object.assign(chatWindow.style, windowStyle);
    
    // Criar header
    const header = document.createElement('div');
    const headerStyle = {
      background: 'linear-gradient(135deg, #17A2B8, #138496)',
      color: 'white',
      padding: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    };
    Object.assign(header.style, headerStyle);
    
    const titleDiv = document.createElement('div');
    titleDiv.style.display = 'flex';
    titleDiv.style.alignItems = 'center';
    titleDiv.innerHTML = `
      <span style="font-size: 20px; margin-right: 8px;">🤖</span>
      <span style="font-weight: 600;">Navi</span>
      <span id="navi-status" style="margin-left: 8px;">🟢</span>
    `;
    
    const closeButton = document.createElement('button');
    closeButton.id = 'navi-close-chat';
    const closeButtonStyle = {
      background: 'none',
      border: 'none',
      color: 'white',
      cursor: 'pointer',
      fontSize: '20px',
      padding: '4px'
    };
    Object.assign(closeButton.style, closeButtonStyle);
    closeButton.innerHTML = '✕';
    
    header.appendChild(titleDiv);
    header.appendChild(closeButton);
    
    // Criar body
    const body = document.createElement('div');
    body.id = 'navi-chat-body';
    const bodyStyle = {
      flex: '1',
      display: 'flex',
      flexDirection: 'column'
    };
    Object.assign(body.style, bodyStyle);
    
    // Criar área de mensagens
    const messagesArea = document.createElement('div');
    messagesArea.id = 'navi-chat-messages';
    const messagesStyle = {
      flex: '1',
      padding: '16px',
      overflowY: 'auto',
      background: '#f8f9fa',
      minHeight: '0', // Importante para flex funcionar
      maxHeight: '350px', // Altura máxima fixa para garantir scroll
      height: '350px' // Altura fixa para área de mensagens
    };
    Object.assign(messagesArea.style, messagesStyle);
    
    // Mensagem inicial
    const initialMessage = document.createElement('div');
    initialMessage.style.marginBottom = '16px';
    initialMessage.innerHTML = `
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
    `;
    messagesArea.appendChild(initialMessage);
    
    // Criar área de input
    const inputArea = document.createElement('div');
    const inputAreaStyle = {
      padding: '16px',
      borderTop: '1px solid #e9ecef',
      background: 'white',
      flexShrink: '0', // Não permite que encolha
      minHeight: '80px' // Altura mínima fixa
    };
    Object.assign(inputArea.style, inputAreaStyle);
    
    const inputWrapper = document.createElement('div');
    inputWrapper.style.display = 'flex';
    inputWrapper.style.gap = '8px';
    
    const input = document.createElement('input');
    input.id = 'navi-chat-input';
    input.type = 'text';
    input.placeholder = 'Digite sua mensagem...';
    const inputStyle = {
      flex: '1',
      padding: '12px',
      border: '1px solid #e9ecef',
      borderRadius: '8px',
      outline: 'none',
      fontSize: '14px'
    };
    Object.assign(input.style, inputStyle);
    
    const sendButton = document.createElement('button');
    sendButton.id = 'navi-chat-send';
    const sendButtonStyle = {
      background: '#17A2B8',
      color: 'white',
      border: 'none',
      padding: '12px 16px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '16px'
    };
    Object.assign(sendButton.style, sendButtonStyle);
    sendButton.innerHTML = '📤';
    
    inputWrapper.appendChild(input);
    inputWrapper.appendChild(sendButton);
    inputArea.appendChild(inputWrapper);
    
    // Montar estrutura
    body.appendChild(messagesArea);
    body.appendChild(inputArea);
    chatWindow.appendChild(header);
    chatWindow.appendChild(body);
    
    document.body.appendChild(chatWindow);
    console.log('💬 Janela do chat criada e adicionada ao DOM');
    console.log('🔍 Debug - chatWindow element:', chatWindow);
    console.log('🔍 Debug - chatWindow position:', chatWindow.style.position);
    console.log('🔍 Debug - chatWindow z-index:', chatWindow.style.zIndex);
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
      // Garantir que a janela seja visível
      chatWindow.style.display = 'flex';
      chatWindow.style.visibility = 'visible';
      chatWindow.style.opacity = '1';
      chatWindow.style.zIndex = '999998';
      
      this.isOpen = true;
      
      // Focar no input
      const input = document.getElementById('navi-chat-input');
      if (input) {
        setTimeout(() => input.focus(), 100);
      }
      
      console.log('✅ Chat aberto - janela deve estar visível agora');
      console.log('🔍 Debug - chatWindow:', chatWindow);
      console.log('🔍 Debug - chatWindow.style.display:', chatWindow.style.display);
    } else {
      console.error('❌ Janela do chat não encontrada!');
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

  // Função para processar texto e converter formatação
  processMessageText(text) {
    if (!text) return '';
    
    // Converter quebras de linha em <br>
    let processedText = text.replace(/\n/g, '<br>');
    
    // Converter **texto** em <strong>texto</strong>
    processedText = processedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Converter *texto* em <em>texto</em>
    processedText = processedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Converter bullet points • em <li>
    processedText = processedText.replace(/•\s*/g, '• ');
    
    // Adicionar espaçamento após emojis de seção
    processedText = processedText.replace(/(📋|🕒|🏖️|📚|🎯|⚠️|✅|⏳|🚀|💡|🔍|📝|🎭|🤖|👤|😊|🚨|💙|🤗|😌|🎉|👍|👎|😞|😕)/g, '$1 ');
    
    return processedText;
  }

  addMessage(text, sender) {
    const messagesContainer = document.getElementById('navi-chat-messages');
    if (!messagesContainer) {
      console.error('❌ Container de mensagens não encontrado!');
      return;
    }
    
    const messageDiv = document.createElement('div');
    Object.assign(messageDiv.style, {
      marginBottom: '16px'
    });
    
    const avatar = sender === 'navi' ? '🤖' : '👤';
    const isUser = sender === 'user';
    
    // Criar container principal
    const mainDiv = document.createElement('div');
    Object.assign(mainDiv.style, {
      display: 'flex',
      alignItems: 'flex-start',
      flexDirection: isUser ? 'row-reverse' : 'row'
    });
    
    // Criar avatar
    const avatarDiv = document.createElement('div');
    Object.assign(avatarDiv.style, {
      width: '32px',
      height: '32px',
      background: sender === 'navi' ? '#17A2B8' : '#6c757d',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: '12px',
      fontSize: '16px',
      color: 'white',
      flexShrink: '0'
    });
    avatarDiv.textContent = avatar;
    
    // Criar balão de mensagem
    const messageBalloon = document.createElement('div');
    Object.assign(messageBalloon.style, {
      background: sender === 'navi' ? 'white' : '#17A2B8',
      color: sender === 'navi' ? '#000' : '#fff',
      padding: '12px',
      borderRadius: '12px',
      maxWidth: '80%',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      wordWrap: 'break-word',
      lineHeight: '1.4'
    });
    
    // Processar texto para formatação
    if (sender === 'navi') {
      // Para mensagens do Navi, usar innerHTML com formatação
      messageBalloon.innerHTML = this.processMessageText(text);
    } else {
      // Para mensagens do usuário, usar textContent (mais seguro)
      messageBalloon.textContent = text;
    }
    
    // Montar estrutura
    mainDiv.appendChild(avatarDiv);
    mainDiv.appendChild(messageBalloon);
    messageDiv.appendChild(mainDiv);
    messagesContainer.appendChild(messageDiv);
    
    // Scroll para baixo
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    console.log(`✅ Mensagem adicionada: ${sender} - ${text.substring(0, 50)}...`);
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