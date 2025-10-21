const { supabase } = require('./client');
const SupabaseAuthService = require('./authService');

class SupabaseChatService {
  constructor() {
    this.channels = new Map();
    this.activeConnections = new Map();
    this.authService = new SupabaseAuthService();
  }

  // Verificar autenticação antes de operações
  async checkAuth() {
    const isAuthenticated = await this.authService.checkAuth();
    if (!isAuthenticated) {
      throw new Error('Usuário não autenticado');
    }
    return this.authService.getCurrentUserId();
  }

  // Criar sessão de chat
  async createChatSession(userId = null, sessionName = null) {
    try {
      // Se userId não fornecido, usar usuário autenticado
      if (!userId) {
        userId = await this.checkAuth();
      }

      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: userId,
          session_name: sessionName || `Chat ${new Date().toLocaleString()}`
        })
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ Sessão de chat criada:', data.id);
      return data;
    } catch (error) {
      console.error('❌ Erro ao criar sessão:', error);
      throw error;
    }
  }

  // Salvar mensagem
  async saveMessage(userId = null, message, messageType = 'user', context = null) {
    try {
      // Se userId não fornecido, usar usuário autenticado
      if (!userId) {
        userId = await this.checkAuth();
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: userId,
          message: message,
          message_type: messageType,
          context: context
        })
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ Mensagem salva:', data.id);
      return data;
    } catch (error) {
      console.error('❌ Erro ao salvar mensagem:', error);
      throw error;
    }
  }

  // Obter histórico de mensagens
  async getChatHistory(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return data.reverse(); // Ordenar cronologicamente
    } catch (error) {
      console.error('❌ Erro ao obter histórico:', error);
      throw error;
    }
  }

  // Atualizar status de conexão
  async updateConnectionStatus(userId, connectionId, isOnline = true) {
    try {
      const { data, error } = await supabase
        .from('chat_connections')
        .upsert({
          user_id: userId,
          connection_id: connectionId,
          is_online: isOnline,
          last_seen: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('❌ Erro ao atualizar conexão:', error);
      throw error;
    }
  }

  // Configurar canal Realtime para usuário
  setupUserChannel(userId, onMessage, onConnectionChange) {
    const channelName = `user-chat-${userId}`;
    
    // Remover canal existente se houver
    if (this.channels.has(channelName)) {
      this.disconnectUserChannel(userId);
    }

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        console.log('📨 Nova mensagem recebida:', payload);
        if (onMessage) onMessage(payload);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_connections',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        console.log('🔌 Status de conexão alterado:', payload);
        if (onConnectionChange) onConnectionChange(payload);
      })
      .subscribe((status) => {
        console.log(`📡 Canal ${channelName}:`, status);
        if (status === 'SUBSCRIBED') {
          this.activeConnections.set(userId, channel);
        }
      });

    this.channels.set(channelName, channel);
    return channel;
  }

  // Desconectar canal do usuário
  disconnectUserChannel(userId) {
    const channelName = `user-chat-${userId}`;
    const channel = this.channels.get(channelName);
    
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
      this.activeConnections.delete(userId);
      console.log(`🔌 Canal ${channelName} desconectado`);
    }
  }

  // Desconectar todos os canais
  disconnectAll() {
    this.channels.forEach((channel, name) => {
      supabase.removeChannel(channel);
      console.log(`🔌 Canal ${name} desconectado`);
    });
    this.channels.clear();
    this.activeConnections.clear();
  }

  // Obter usuários online
  async getOnlineUsers() {
    try {
      const { data, error } = await supabase
        .from('chat_connections')
        .select('user_id, last_seen')
        .eq('is_online', true)
        .gt('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Últimos 5 minutos

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Erro ao obter usuários online:', error);
      throw error;
    }
  }
}

module.exports = SupabaseChatService;
