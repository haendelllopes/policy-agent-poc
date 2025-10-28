// Chat Widget Híbrido - HTTP + Supabase Realtime
class HybridChatWidget {
  constructor() {
    this.isOpen = false;
    this.isConnected = false;
    this.userId = this.generateUserId();
    this.messageHistory = [];
    this.currentMode = 'detecting'; // detecting, supabase, http
    this.supabaseAvailable = false;
    this.ws = null;
    this.httpMode = false;
    this.pageContext = this.getPageContext();
    
    // Elementos DOM
    this.widget = null;
    this.messagesContainer = null;
    this.input = null;
    this.sendBtn = null;
    this.status = null;
    this.avatar = null;
    
    this.init();
  }

  generateUserId() {
    return 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  getPageContext() {
    return {
      url: window.location.href,
      title: document.title,
      timestamp: new Date().toISOString()
    };
  }

  async init() {
    console.log('🚀 Inicializando Chat Widget Híbrido...');
    
    // Criar interface
    this.createWidget();
    
    // Configurar eventos
    this.setupEventListeners();
    
    // Detectar melhor sistema disponível
    await this.detectBestSystem();
    
    console.log('✅ Chat Widget Híbrido inicializado');
  }

  async detectBestSystem() {
    console.log('🔍 Detectando melhor sistema disponível...');
    
    // Tentar Supabase primeiro
    if (await this.trySupabase()) {
      this.currentMode = 'supabase';
      this.supabaseAvailable = true;
      console.log('✅ Modo Supabase Realtime ativado');
    } else {
      // Fallback para HTTP
      this.currentMode = 'http';
      this.supabaseAvailable = false;
      console.log('✅ Modo HTTP ativado (fallback)');
    }
    
    // Conectar ao sistema escolhido
    await this.connectToSystem();
  }

  async trySupabase() {
    try {
      // Verificar se Supabase JS está disponível
      if (typeof createClient === 'undefined') {
        console.log('⚠️ Supabase JS não disponível');
        return false;
      }

      // Tentar criar cliente Supabase
      if (window.supabase) {
        console.log('✅ Cliente Supabase encontrado');
        return true;
      }

      // Tentar criar cliente manualmente
      const supabaseUrl = 'https://gxqwfltteimexngybwna.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cXdmbHR0ZWltZXhuZ3lid25hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTg4MzMsImV4cCI6MjA3NTA5NDgzM30.522lie-dDK_0ct6X1iYpQcI2RZaH6sq8s9jjwTY8AOI';
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      window.supabase = supabase;
      
      // Testar conexão
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id')
        .limit(1);
      
      if (error) {
        console.log('⚠️ Erro na conexão Supabase:', error.message);
        return false;
      }
      
      console.log('✅ Conexão Supabase testada com sucesso');
      return true;
      
    } catch (error) {
      console.log('⚠️ Erro ao testar Supabase:', error.message);
      return false;
    }
  }

  async connectToSystem() {
    if (this.currentMode === 'supabase') {
      await this.connectSupabase();
    } else {
      await this.connectHttp();
    }
  }

  async connectSupabase() {
    try {
      this.isConnected = true;
      this.updateStatus('Online (Supabase Realtime)');
      this.sendBtn.disabled = false;
      this.updateAvatar('online');
      console.log('✅ Conectado ao Supabase Realtime');
    } catch (error) {
      console.error('❌ Erro na conexão Supabase:', error);
      // Fallback para HTTP
      this.currentMode = 'http';
      await this.connectHttp();
    }
  }

  async connectHttp() {
    try {
      // Verificar se estamos em produção (Vercel)
      const isProduction = window.location.hostname !== 'localhost' && 
                          window.location.hostname !== '127.0.0.1';
      
      if (isProduction) {
        // Modo HTTP para produção
        this.httpMode = true;
        this.isConnected = true;
        this.updateStatus('Online (HTTP)');
        this.sendBtn.disabled = false;
        this.updateAvatar('online');
        console.log('✅ Conectado via HTTP (Produção)');
      } else {
        // Tentar WebSocket local
        await this.connectWebSocketLocal();
      }
    } catch (error) {
      console.error('❌ Erro na conexão HTTP:', error);
    }
  }

  async connectWebSocketLocal() {
    try {
      const wsUrl = 'ws://localhost:3000/ws/chat';
      console.log('🔌 Conectando WebSocket local:', wsUrl);
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        this.isConnected = true;
        this.updateStatus('Online (WebSocket)');
        this.sendBtn.disabled = false;
        this.updateAvatar('online');
        console.log('✅ Conectado via WebSocket local');
      };
      
      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      };
      
      this.ws.onclose = () => {
        this.isConnected = false;
        this.updateStatus('Desconectado');
        this.updateAvatar('offline');
        console.log('🔌 WebSocket desconectado');
      };
      
      this.ws.onerror = (error) => {
        console.error('❌ Erro WebSocket:', error);
        // Fallback para HTTP
        this.currentMode = 'http';
        this.connectHttp();
      };
      
    } catch (error) {
      console.error('❌ Erro ao conectar WebSocket:', error);
    }
  }

  createWidget() {
    const widgetHTML = `
      <div class="chat-widget" id="chatWidget">
        <div class="chat-header">
          <div style="display: flex; align-items: center;">
            <div class="chat-avatar" id="chatAvatar">
              <i data-feather="message-circle" class="chat-icon"></i>
            </div>
            <div class="chat-info">
              <h3>Navi</h3>
              <p id="chatStatus">Detectando sistema...</p>
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
    
    // Obter referências dos elementos
    this.widget = document.getElementById('chatWidget');
    this.messagesContainer = document.getElementById('chatMessages');
    this.input = document.getElementById('chatInput');
    this.sendBtn = document.getElementById('chatSend');
    this.status = document.getElementById('chatStatus');
    this.avatar = document.getElementById('chatAvatar');
    
    // Aplicar Feather Icons
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  }

  setupEventListeners() {
    // Toggle chat
    document.getElementById('chatToggleBtn').addEventListener('click', () => {
      this.toggleChat();
    });

    // Close chat
    document.getElementById('chatClose').addEventListener('click', () => {
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

  async sendMessage() {
    const text = this.input.value.trim();
    if (!text || !this.isConnected) return;

    // Adicionar mensagem do usuário
    this.addMessage(text, 'user');

    if (this.currentMode === 'supabase') {
      await this.sendMessageSupabase(text);
    } else {
      await this.sendMessageHttp(text);
    }

    this.input.value = '';
    this.input.style.height = 'auto';
    this.showTypingIndicator();
  }

  async sendMessageSupabase(text) {
    try {
      // Salvar mensagem no Supabase
      const { data, error } = await window.supabase
        .from('chat_messages')
        .insert({
          user_id: this.userId,
          message: text,
          message_type: 'user'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao salvar no Supabase:', error);
        // Fallback para HTTP
        await this.sendMessageHttp(text);
        return;
      }

      // Simular resposta do assistente
      setTimeout(() => {
        const responses = [
          `🤖 Recebi sua mensagem: "${text}". Esta é uma resposta via Supabase Realtime!`,
          `🤖 Interessante! Você disse: "${text}". Como posso ajudar mais?`,
          `🤖 Entendi: "${text}". Vou processar isso via Supabase Realtime.`
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        this.addMessage(randomResponse, 'bot');
        
        // Salvar resposta no Supabase
        this.saveMessageSupabase(randomResponse, 'assistant');
      }, 1000);

    } catch (error) {
      console.error('❌ Erro no Supabase:', error);
      // Fallback para HTTP
      await this.sendMessageHttp(text);
    }
  }

  async sendMessageHttp(text) {
    try {
      const isProduction = window.location.hostname !== 'localhost' && 
                          window.location.hostname !== '127.0.0.1';

      if (isProduction || this.httpMode) {
        // Modo HTTP para produção
        const response = await fetch('/api/chat/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: this.userId, text: text, context: this.pageContext })
        });

        if (response.ok) {
          const data = await response.json();
          this.handleMessage(data);
        } else {
          this.handleMessage({ type: 'error', message: 'Erro ao enviar mensagem' });
        }
      } else {
        // WebSocket local
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'chat',
            userId: this.userId,
            text: text,
            context: this.pageContext
          }));
        } else {
          this.handleMessage({ type: 'error', message: 'Conexão perdida' });
        }
      }
    } catch (error) {
      console.error('❌ Erro HTTP:', error);
      this.handleMessage({ type: 'error', message: 'Erro de conexão' });
    }
  }

  async saveMessageSupabase(message, type) {
    try {
      await window.supabase
        .from('chat_messages')
        .insert({
          user_id: this.userId,
          message: message,
          message_type: type
        });
    } catch (error) {
      console.error('❌ Erro ao salvar mensagem no Supabase:', error);
    }
  }

  handleMessage(data) {
    this.hideTypingIndicator();
    
    if (data.type === 'error') {
      this.addMessage(data.message, 'system');
    } else {
      const message = data.message || data.text || 'Resposta recebida';
      this.addMessage(message, 'bot');
    }
  }

  addMessage(text, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';
    bubbleDiv.innerHTML = this.formatMessage(text);
    
    messageDiv.appendChild(bubbleDiv);
    this.messagesContainer.appendChild(messageDiv);
    
    // Scroll para baixo
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    
    // Adicionar ao histórico
    this.messageHistory.push({ text, type, timestamp: new Date() });
  }

  formatMessage(text) {
    if (!text) return '<em>Mensagem vazia</em>';
    
    // Detectar e converter URLs em links clicáveis
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    text = text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #17A2B8; text-decoration: underline;">$1</a>');
    
    // Formatação básica de markdown
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
  }

  showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot typing-indicator';
    typingDiv.innerHTML = '<div class="message-bubble"><p>🤖 Digitando...</p></div>';
    this.messagesContainer.appendChild(typingDiv);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  hideTypingIndicator() {
    const typingIndicator = this.messagesContainer.querySelector('.typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
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

  // Métodos para debug
  getCurrentMode() {
    return this.currentMode;
  }

  getMessageHistory() {
    return this.messageHistory;
  }
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  window.hybridChatWidget = new HybridChatWidget();
});

// Exportar para uso global
window.HybridChatWidget = HybridChatWidget;

