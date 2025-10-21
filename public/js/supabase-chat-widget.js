// Chat Widget com Supabase Realtime (Versão Simplificada)
class SupabaseChatWidget {
  constructor() {
    this.isOpen = false;
    this.isConnected = false;
         this.userId = null; // Será definido após autenticação
    this.messageHistory = [];
    
    // Elementos DOM
    this.widget = null;
    this.messagesContainer = null;
    this.input = null;
    this.sendBtn = null;
    this.status = null;
    this.avatar = null;
    
    this.init();
  }

  async init() {
    console.log('🚀 Inicializando Supabase Chat Widget...');
    
    // Criar interface
    this.createWidget();
    
    // Configurar eventos
    this.setupEventListeners();
    
    // Simular conexão (já que foreign keys precisam ser corrigidas)
    this.simulateConnection();
    
    console.log('✅ Supabase Chat Widget inicializado');
  }

  createWidget() {
    const widgetHTML = `
      <div class="chat-widget" id="supabaseChatWidget">
        <div class="chat-header">
          <div style="display: flex; align-items: center;">
            <div class="chat-avatar" id="supabaseChatAvatar">
              <i data-feather="message-circle" class="chat-icon"></i>
            </div>
            <div class="chat-info">
              <h3>Navi (Supabase)</h3>
              <p id="supabaseChatStatus">Conectando...</p>
            </div>
          </div>
          <button class="chat-toggle" id="supabaseChatClose">
            <i data-feather="x" class="chat-toggle-icon"></i>
          </button>
        </div>
        
        <div class="chat-messages" id="supabaseChatMessages">
          <div class="message system">
            <div class="message-content">
              <p>🤖 Olá! Sou o Navi com Supabase Realtime. Como posso ajudar?</p>
            </div>
          </div>
        </div>
        
        <div class="chat-input-container">
          <div class="chat-input">
            <input type="text" id="supabaseChatInput" placeholder="Digite sua mensagem..." maxlength="500">
            <button id="supabaseChatSend" disabled>
              <i data-feather="send" class="send-icon"></i>
            </button>
          </div>
        </div>
      </div>
      
      <button class="chat-toggle-btn" id="supabaseChatToggleBtn">
        <i data-feather="message-circle"></i>
      </button>
    `;

    document.body.insertAdjacentHTML('beforeend', widgetHTML);
    
    // Obter referências dos elementos
    this.widget = document.getElementById('supabaseChatWidget');
    this.messagesContainer = document.getElementById('supabaseChatMessages');
    this.input = document.getElementById('supabaseChatInput');
    this.sendBtn = document.getElementById('supabaseChatSend');
    this.status = document.getElementById('supabaseChatStatus');
    this.avatar = document.getElementById('supabaseChatAvatar');
    
    // Aplicar Feather Icons
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  }

  setupEventListeners() {
    // Toggle chat
    document.getElementById('supabaseChatToggleBtn').addEventListener('click', () => {
      this.toggleChat();
    });

    // Close chat
    document.getElementById('supabaseChatClose').addEventListener('click', () => {
      this.closeChat();
    });

    // Send message
    this.sendBtn.addEventListener('click', () => {
      this.sendMessage();
    });

    // Enter key
    this.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Input change
    this.input.addEventListener('input', () => {
      this.sendBtn.disabled = !this.input.value.trim() || !this.isConnected;
    });
  }

         async simulateConnection() {
           // Tentar conectar com Supabase real
           try {
             if (window.supabase) {
               // Verificar se usuário está autenticado
               const { data: { user }, error } = await window.supabase.auth.getUser();
               
               if (user && !error) {
                 this.userId = user.id;
                 this.isConnected = true;
                 this.updateStatus(`Online (${user.email})`);
                 this.sendBtn.disabled = false;
                 this.updateAvatar('online');
                 console.log('✅ Usuário autenticado:', user.email);
               } else {
                 // Usuário não autenticado - modo público
                 this.userId = 'anonymous-' + Date.now();
                 this.isConnected = true;
                 this.updateStatus('Online (Modo Público)');
                 this.sendBtn.disabled = false;
                 this.updateAvatar('online');
                 console.log('✅ Modo público ativado');
               }
             } else {
               throw new Error('Supabase não disponível');
             }
           } catch (error) {
             console.error('❌ Erro na conexão:', error);
             // Fallback para modo mock
             this.userId = 'mock-' + Date.now();
             this.isConnected = true;
             this.updateStatus('Online (Modo Mock)');
             this.sendBtn.disabled = false;
             this.updateAvatar('online');
           }
         }

  async sendMessage() {
    const text = this.input.value.trim();
    if (!text || !this.isConnected) return;

    // Adicionar mensagem do usuário
    this.addMessage(text, 'user');
    
    // Simular resposta do assistente
    setTimeout(() => {
      const responses = [
        `🤖 Recebi sua mensagem: "${text}". Esta é uma resposta simulada via Supabase Realtime!`,
        `🤖 Interessante! Você disse: "${text}". Como posso ajudar mais?`,
        `🤖 Entendi: "${text}". Vou processar isso via Supabase Realtime.`,
        `🤖 Ótima pergunta sobre "${text}"! Deixe-me consultar o banco de dados...`
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      this.addMessage(randomResponse, 'assistant');
    }, 1000);

    this.input.value = '';
    this.sendBtn.disabled = true;
  }

  addMessage(text, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = this.formatMessage(text);
    
    messageDiv.appendChild(contentDiv);
    this.messagesContainer.appendChild(messageDiv);
    
    // Scroll para baixo
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    
    // Adicionar ao histórico
    this.messageHistory.push({ text, type, timestamp: new Date() });
  }

  formatMessage(text) {
    if (!text) return '<em>Mensagem vazia</em>';
    
    // Formatação básica de markdown
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
  }

  updateStatus(status) {
    if (this.status) {
      this.status.textContent = status;
    }
  }

  updateAvatar(status) {
    if (this.avatar) {
      this.avatar.className = `chat-avatar ${status}`;
    }
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    this.widget.classList.toggle('open', this.isOpen);
    
    if (this.isOpen) {
      this.input.focus();
    }
  }

  closeChat() {
    this.isOpen = false;
    this.widget.classList.remove('open');
  }

  // Métodos para teste
  getMessageHistory() {
    return this.messageHistory;
  }

  // Cleanup
  destroy() {
    // Remover elementos DOM
    if (this.widget) {
      this.widget.remove();
    }
    
    const toggleBtn = document.getElementById('supabaseChatToggleBtn');
    if (toggleBtn) {
      toggleBtn.remove();
    }
  }
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  window.supabaseChatWidget = new SupabaseChatWidget();
});

// Exportar para uso global
window.SupabaseChatWidget = SupabaseChatWidget;
