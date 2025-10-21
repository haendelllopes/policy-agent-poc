const { supabase } = require('./client');

class SupabaseRealtimeConfig {
  constructor() {
    this.channels = new Map();
    this.isConnected = false;
  }

  async connect() {
    try {
      console.log('🔌 Conectando Supabase Realtime...');
      
      // Testar conexão básica
      const { data, error } = await supabase
        .from('colaboradores')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      
      this.isConnected = true;
      console.log('✅ Supabase Realtime conectado');
      return true;
      
    } catch (error) {
      console.error('❌ Erro conexão Realtime:', error);
      this.isConnected = false;
      return false;
    }
  }

  createChannel(channelName, tableName, callback) {
    if (!this.isConnected) {
      console.error('❌ Realtime não conectado');
      return null;
    }

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: tableName
      }, callback)
      .subscribe((status) => {
        console.log(`📡 Canal ${channelName}:`, status);
      });

    this.channels.set(channelName, channel);
    return channel;
  }

  disconnectChannel(channelName) {
    const channel = this.channels.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
      console.log(`🔌 Canal ${channelName} desconectado`);
    }
  }

  disconnectAll() {
    this.channels.forEach((channel, name) => {
      supabase.removeChannel(channel);
      console.log(`🔌 Canal ${name} desconectado`);
    });
    this.channels.clear();
    this.isConnected = false;
  }
}

module.exports = SupabaseRealtimeConfig;
