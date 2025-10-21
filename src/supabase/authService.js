const { supabase } = require('./client');

class SupabaseAuthService {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = false;
  }

  // Verificar se usuário está autenticado
  async checkAuth() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('❌ Erro ao verificar autenticação:', error);
        return false;
      }
      
      if (user) {
        this.currentUser = user;
        this.isAuthenticated = true;
        console.log('✅ Usuário autenticado:', user.email);
        return true;
      } else {
        this.currentUser = null;
        this.isAuthenticated = false;
        console.log('⚠️ Usuário não autenticado');
        return false;
      }
    } catch (error) {
      console.error('❌ Erro na verificação de auth:', error);
      return false;
    }
  }

  // Fazer login com email e senha
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) {
        console.error('❌ Erro no login:', error.message);
        return { success: false, error: error.message };
      }

      this.currentUser = data.user;
      this.isAuthenticated = true;
      console.log('✅ Login realizado:', data.user.email);
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('❌ Erro no login:', error);
      return { success: false, error: error.message };
    }
  }

  // Fazer logout
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Erro no logout:', error);
        return { success: false, error: error.message };
      }

      this.currentUser = null;
      this.isAuthenticated = false;
      console.log('✅ Logout realizado');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      return { success: false, error: error.message };
    }
  }

  // Criar usuário de teste (apenas para desenvolvimento)
  async createTestUser(email, password) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            name: 'Usuário Teste Supabase',
            role: 'user'
          }
        }
      });

      if (error) {
        console.error('❌ Erro ao criar usuário:', error.message);
        return { success: false, error: error.message };
      }

      console.log('✅ Usuário criado:', data.user?.email);
      return { success: true, user: data.user };
    } catch (error) {
      console.error('❌ Erro ao criar usuário:', error);
      return { success: false, error: error.message };
    }
  }

  // Obter usuário atual
  getCurrentUser() {
    return this.currentUser;
  }

  // Verificar se está autenticado
  isUserAuthenticated() {
    return this.isAuthenticated && this.currentUser !== null;
  }

  // Obter ID do usuário atual
  getCurrentUserId() {
    return this.currentUser?.id || null;
  }

  // Verificar permissões de chat
  canAccessChat(targetUserId) {
    if (!this.isAuthenticated) return false;
    return this.currentUser.id === targetUserId;
  }

  // Configurar listener de mudanças de auth
  setupAuthListener(onAuthChange) {
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session) {
        this.currentUser = session.user;
        this.isAuthenticated = true;
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null;
        this.isAuthenticated = false;
      }
      
      if (onAuthChange) {
        onAuthChange(event, session);
      }
    });
  }
}

module.exports = SupabaseAuthService;
