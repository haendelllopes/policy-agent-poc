/**
 * Integração do Sistema de Formatação de Links com Chat Flutuante
 * 
 * Este arquivo mostra como integrar o sistema de formatação de links
 * com o chat flutuante WebSocket existente.
 */

// ===================================================================
// INTEGRAÇÃO COM CHAT FLUTUANTE EXISTENTE
// ===================================================================

// Incluir o script de formatação de links
// <script src="/js/chat-link-formatter.js"></script>

// Função para atualizar o chat flutuante com formatação de links
function atualizarChatComLinks(mensagem) {
  const chatContainer = document.getElementById('chat-messages');
  if (!chatContainer) return;
  
  // Processar mensagem com formatação de links
  const mensagemFormatada = processarMensagemWebSocket(mensagem);
  
  // Criar elemento da mensagem
  const messageElement = document.createElement('div');
  messageElement.className = 'chat-message';
  messageElement.innerHTML = mensagemFormatada;
  
  // Adicionar ao chat
  chatContainer.appendChild(messageElement);
  
  // Scroll para baixo
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Função para enviar mensagem com links formatados
function enviarMensagemComLinks(texto, links = []) {
  const mensagem = {
    text: texto,
    links: links,
    timestamp: new Date().toISOString()
  };
  
  // Enviar via WebSocket
  if (window.chatSocket) {
    window.chatSocket.send(JSON.stringify(mensagem));
  }
  
  // Adicionar ao chat local
  atualizarChatComLinks(mensagem);
}

// ===================================================================
// EXEMPLOS DE USO PRÁTICO
// ===================================================================

// Exemplo 1: Mensagem com dashboard
function enviarMensagemDashboard() {
  const links = [{
    url: 'https://navigator-gules.vercel.app/colaborador-dashboard.html?colaborador_id=123&tenant=demo',
    titulo: 'Painel Pessoal',
    descricao: 'Acompanhe seu progresso nas trilhas'
  }];
  
  enviarMensagemComLinks(
    '🎉 Parabéns! Você concluiu uma trilha!',
    links
  );
}

// Exemplo 2: Mensagem com múltiplos links
function enviarMensagemMultiplosLinks() {
  const links = [
    {
      url: 'https://navigator-gules.vercel.app/colaborador-dashboard.html?colaborador_id=123&tenant=demo',
      titulo: 'Painel Pessoal',
      descricao: 'Acompanhe seu progresso'
    },
    {
      url: 'https://drive.google.com/file/abc123',
      titulo: 'Política de Senhas',
      descricao: 'Documento obrigatório'
    },
    {
      url: 'https://youtube.com/watch?v=xyz',
      titulo: 'Treinamento LGPD',
      descricao: 'Vídeo explicativo'
    }
  ];
  
  enviarMensagemComLinks(
    '📚 Você tem novos conteúdos disponíveis:',
    links
  );
}

// Exemplo 3: Mensagem com link compacto
function enviarMensagemLinkCompacto() {
  const texto = 'Acesse seu painel: ';
  const linkCompacto = adicionarLinkCompacto(
    'https://navigator-gules.vercel.app/colaborador-dashboard.html?colaborador_id=123&tenant=demo',
    'Dashboard'
  );
  
  const mensagem = {
    text: texto + linkCompacto,
    timestamp: new Date().toISOString()
  };
  
  atualizarChatComLinks(mensagem);
}

// ===================================================================
// INTEGRAÇÃO COM WEBSOCKET EXISTENTE
// ===================================================================

// Função para processar mensagens recebidas do servidor
function processarMensagemServidor(data) {
  try {
    const mensagem = JSON.parse(data);
    
    // Verificar se é uma mensagem com links
    if (mensagem.dashboard_url || mensagem.links || mensagem.url) {
      atualizarChatComLinks(mensagem);
    } else {
      // Processar mensagem normal com detecção automática de URLs
      const mensagemProcessada = processarMensagemComLinks(mensagem.text || mensagem.message || '');
      
      const messageElement = document.createElement('div');
      messageElement.className = 'chat-message';
      messageElement.innerHTML = mensagemProcessada;
      
      const chatContainer = document.getElementById('chat-messages');
      if (chatContainer) {
        chatContainer.appendChild(messageElement);
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }
  } catch (error) {
    console.error('Erro ao processar mensagem do servidor:', error);
  }
}

// ===================================================================
// INTEGRAÇÃO COM ENDPOINTS EXISTENTES
// ===================================================================

// Função para buscar trilhas e formatar links
async function buscarTrilhasComLinks(colaboradorId) {
  try {
    const response = await fetch(`/api/agent-trilhas/disponiveis/${colaboradorId}?tenant=demo`);
    const data = await response.json();
    
    if (data.dashboard_url) {
      const links = [{
        url: data.dashboard_url,
        titulo: 'Painel Pessoal',
        descricao: 'Acompanhe seu progresso nas trilhas'
      }];
      
      // Adicionar links das trilhas disponíveis
      if (data.disponiveis && data.disponiveis.length > 0) {
        data.disponiveis.forEach(trilha => {
          if (trilha.url) {
            links.push({
              url: trilha.url,
              titulo: trilha.nome,
              descricao: trilha.descricao
            });
          }
        });
      }
      
      enviarMensagemComLinks(
        '📚 Suas trilhas disponíveis:',
        links
      );
    }
  } catch (error) {
    console.error('Erro ao buscar trilhas:', error);
  }
}

// Função para iniciar trilha e formatar links
async function iniciarTrilhaComLinks(trilhaId, colaboradorId) {
  try {
    const response = await fetch('/api/agent-trilhas/iniciar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        trilha_id: trilhaId,
        colaborador_id: colaboradorId
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      const links = [];
      
      // Adicionar link do dashboard
      if (data.dashboard_url) {
        links.push({
          url: data.dashboard_url,
          titulo: 'Painel Pessoal',
          descricao: 'Acompanhe seu progresso na trilha'
        });
      }
      
      // Adicionar link do primeiro conteúdo
      if (data.primeiro_conteudo && data.primeiro_conteudo.url) {
        links.push({
          url: data.primeiro_conteudo.url,
          titulo: data.primeiro_conteudo.titulo,
          descricao: data.primeiro_conteudo.descricao
        });
      }
      
      enviarMensagemComLinks(
        `🎉 Trilha "${data.trilha.nome}" iniciada com sucesso!`,
        links
      );
    }
  } catch (error) {
    console.error('Erro ao iniciar trilha:', error);
  }
}

// ===================================================================
// INICIALIZAÇÃO
// ===================================================================

// Função para inicializar o sistema de formatação de links
function inicializarSistemaLinks() {
  // Verificar se o formatador está disponível
  if (typeof window.chatLinkFormatter === 'undefined') {
    console.error('Sistema de formatação de links não carregado!');
    return;
  }
  
  console.log('✅ Sistema de formatação de links inicializado!');
  
  // Exemplo de uso automático
  setTimeout(() => {
    enviarMensagemDashboard();
  }, 2000);
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', inicializarSistemaLinks);

// ===================================================================
// CSS ADICIONAL PARA FORMATAÇÃO
// ===================================================================

const cssAdicional = `
  <style>
    .link-container {
      animation: slideInUp 0.3s ease-out;
    }
    
    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .link-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }
    
    .link-button:active {
      transform: translateY(0);
    }
    
    .link-compacto {
      display: inline-block;
      margin: 2px;
    }
    
    .link-compacto .link-button-compacto:hover {
      opacity: 0.9;
      transform: scale(1.05);
    }
  </style>
`;

// Adicionar CSS ao head
document.head.insertAdjacentHTML('beforeend', cssAdicional);
