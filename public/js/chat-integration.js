// Integração do chat com páginas específicas - independente do sistema atual
class ChatIntegration {
  constructor() {
    this.setupPageSpecificFeatures();
    this.addGlobalChatButtons();
  }

  setupPageSpecificFeatures() {
    const currentPage = window.location.pathname.split('/').pop();
    
    switch (currentPage) {
      case 'colaborador-trilha-detalhes.html':
        this.setupTrilhaDetailsIntegration();
        break;
      case 'colaborador-trilhas.html':
        this.setupTrilhasIntegration();
        break;
      case 'dashboard.html':
        this.setupDashboardIntegration();
        break;
      case 'admin-trilhas.html':
        this.setupAdminTrilhasIntegration();
        break;
      case 'funcionarios.html':
        this.setupFuncionariosIntegration();
        break;
      case 'documentos.html':
        this.setupDocumentosIntegration();
        break;
    }
  }

  setupTrilhaDetailsIntegration() {
    // Adicionar botão "Perguntar ao Navi" na trilha
    const trilhaTitle = document.querySelector('.trilha-title, h1, .page-title');
    if (trilhaTitle) {
      const chatButton = document.createElement('button');
      chatButton.className = 'btn btn-outline-primary btn-sm';
      chatButton.innerHTML = '💬 Perguntar ao Navi';
      chatButton.style.marginLeft = '10px';
      chatButton.onclick = () => {
        if (window.chatWidget) {
          window.chatWidget.openChatWithMessage(`Tenho dúvidas sobre a trilha "${trilhaTitle.textContent.trim()}"`);
        }
      };
      trilhaTitle.parentNode.appendChild(chatButton);
    }

    // Adicionar botão em cards de conteúdo
    const contentCards = document.querySelectorAll('.content-card, .lesson-card, .module-card');
    contentCards.forEach((card, index) => {
      const title = card.querySelector('h3, h4, .card-title, .lesson-title');
      if (title) {
        const chatButton = document.createElement('button');
        chatButton.className = 'btn btn-sm btn-outline-secondary';
        chatButton.innerHTML = '💬 Dúvida';
        chatButton.style.marginTop = '8px';
        chatButton.onclick = () => {
          if (window.chatWidget) {
            window.chatWidget.openChatWithMessage(`Tenho dúvidas sobre "${title.textContent.trim()}"`);
          }
        };
        card.appendChild(chatButton);
      }
    });
  }

  setupTrilhasIntegration() {
    // Adicionar botão "Perguntar ao Navi" no cabeçalho
    const pageHeader = document.querySelector('.page-header, .content-header, h1');
    if (pageHeader) {
      const chatButton = document.createElement('button');
      chatButton.className = 'btn btn-primary btn-sm';
      chatButton.innerHTML = '💬 Conversar com Navi';
      chatButton.style.marginLeft = '10px';
      chatButton.onclick = () => {
        if (window.chatWidget) {
          window.chatWidget.openChatWithMessage('Preciso de ajuda para escolher uma trilha');
        }
      };
      pageHeader.parentNode.appendChild(chatButton);
    }

    // Adicionar botões em cards de trilhas
    const trilhaCards = document.querySelectorAll('.trilha-card, .card, .course-card');
    trilhaCards.forEach((card) => {
      const title = card.querySelector('.trilha-nome, .card-title, h3, h4');
      const status = card.querySelector('.trilha-status, .status, .badge');
      
      if (title) {
        const chatButton = document.createElement('button');
        chatButton.className = 'btn btn-sm btn-outline-primary';
        chatButton.innerHTML = '💬 Dúvida';
        chatButton.style.marginTop = '8px';
        chatButton.onclick = () => {
          if (window.chatWidget) {
            const statusText = status ? status.textContent.trim() : '';
            window.chatWidget.openChatWithMessage(`Tenho dúvidas sobre a trilha "${title.textContent.trim()}"${statusText ? ` (Status: ${statusText})` : ''}`);
          }
        };
        card.appendChild(chatButton);
      }
    });
  }

  setupDashboardIntegration() {
    // Adicionar botão "Perguntar ao Navi" no cabeçalho
    const pageHeader = document.querySelector('.page-header, .content-header, h1');
    if (pageHeader) {
      const chatButton = document.createElement('button');
      chatButton.className = 'btn btn-primary btn-sm';
      chatButton.innerHTML = '💬 Conversar com Navi';
      chatButton.style.marginLeft = '10px';
      chatButton.onclick = () => {
        if (window.chatWidget) {
          window.chatWidget.openChatWithMessage('Preciso de ajuda com meu onboarding');
        }
      };
      pageHeader.parentNode.appendChild(chatButton);
    }

    // Adicionar botões em métricas
    const metricCards = document.querySelectorAll('.metric-card, .stat-card, .dashboard-card');
    metricCards.forEach((card) => {
      const title = card.querySelector('.metric-title, .card-title, h3, h4');
      if (title) {
        const chatButton = document.createElement('button');
        chatButton.className = 'btn btn-sm btn-outline-info';
        chatButton.innerHTML = '💬 Explicar';
        chatButton.style.marginTop = '8px';
        chatButton.onclick = () => {
          if (window.chatWidget) {
            window.chatWidget.openChatWithMessage(`Pode me explicar sobre "${title.textContent.trim()}"?`);
          }
        };
        card.appendChild(chatButton);
      }
    });
  }

  setupAdminTrilhasIntegration() {
    // Adicionar botão "Perguntar ao Navi" para admins
    const pageHeader = document.querySelector('.page-header, .content-header, h1');
    if (pageHeader) {
      const chatButton = document.createElement('button');
      chatButton.className = 'btn btn-success btn-sm';
      chatButton.innerHTML = '💬 Consultar Navi';
      chatButton.style.marginLeft = '10px';
      chatButton.onclick = () => {
        if (window.chatWidget) {
          window.chatWidget.openChatWithMessage('Preciso de ajuda para gerenciar trilhas');
        }
      };
      pageHeader.parentNode.appendChild(chatButton);
    }
  }

  setupFuncionariosIntegration() {
    // Adicionar botão "Perguntar ao Navi" para RH
    const pageHeader = document.querySelector('.page-header, .content-header, h1');
    if (pageHeader) {
      const chatButton = document.createElement('button');
      chatButton.className = 'btn btn-warning btn-sm';
      chatButton.innerHTML = '💬 Consultar Navi';
      chatButton.style.marginLeft = '10px';
      chatButton.onclick = () => {
        if (window.chatWidget) {
          window.chatWidget.openChatWithMessage('Preciso de ajuda para gerenciar funcionários');
        }
      };
      pageHeader.parentNode.appendChild(chatButton);
    }
  }

  setupDocumentosIntegration() {
    // Adicionar botão "Perguntar ao Navi" para documentos
    const pageHeader = document.querySelector('.page-header, .content-header, h1');
    if (pageHeader) {
      const chatButton = document.createElement('button');
      chatButton.className = 'btn btn-info btn-sm';
      chatButton.innerHTML = '💬 Buscar Documentos';
      chatButton.style.marginLeft = '10px';
      chatButton.onclick = () => {
        if (window.chatWidget) {
          window.chatWidget.openChatWithMessage('Preciso buscar documentos');
        }
      };
      pageHeader.parentNode.appendChild(chatButton);
    }
  }

  addGlobalChatButtons() {
    // Adicionar botões globais em locais estratégicos
    
    // Botão no menu de navegação se existir
    const navMenu = document.querySelector('.navbar-nav, .nav-menu, .main-nav');
    if (navMenu) {
      const chatNavItem = document.createElement('li');
      chatNavItem.className = 'nav-item';
      chatNavItem.innerHTML = `
        <button class="nav-link btn btn-link" onclick="window.chatWidget?.openChat()">
          💬 Chat Navi
        </button>
      `;
      navMenu.appendChild(chatNavItem);
    }

    // Botão flutuante adicional para páginas específicas
    const currentPage = window.location.pathname.split('/').pop();
    if (['colaborador-trilha-detalhes.html', 'colaborador-trilhas.html'].includes(currentPage)) {
      const floatingButton = document.createElement('button');
      floatingButton.className = 'btn btn-primary';
      floatingButton.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 998;
        border-radius: 25px;
        padding: 10px 20px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      `;
      floatingButton.innerHTML = '💬 Ajuda Navi';
      floatingButton.onclick = () => {
        if (window.chatWidget) {
          window.chatWidget.openChat();
        }
      };
      document.body.appendChild(floatingButton);
    }
  }

  // Método para adicionar botão de chat em qualquer elemento
  addChatButtonToElement(element, message = 'Preciso de ajuda') {
    if (!element) return;
    
    const chatButton = document.createElement('button');
    chatButton.className = 'btn btn-sm btn-outline-primary';
    chatButton.innerHTML = '💬 Navi';
    chatButton.style.marginTop = '8px';
    chatButton.onclick = () => {
      if (window.chatWidget) {
        window.chatWidget.openChatWithMessage(message);
      }
    };
    
    element.appendChild(chatButton);
  }

  // Método para adicionar contexto específico da página
  getPageSpecificContext() {
    const currentPage = window.location.pathname.split('/').pop();
    const context = { page: currentPage };
    
    switch (currentPage) {
      case 'colaborador-trilha-detalhes.html':
        const trilhaTitle = document.querySelector('.trilha-title, h1');
        if (trilhaTitle) {
          context.trilha_visualizando = trilhaTitle.textContent.trim();
        }
        break;
        
      case 'colaborador-trilhas.html':
        const trilhas = Array.from(document.querySelectorAll('.trilha-card')).map(card => ({
          nome: card.querySelector('.trilha-nome')?.textContent?.trim(),
          status: card.querySelector('.trilha-status')?.textContent?.trim()
        }));
        context.trilhas_disponiveis = trilhas;
        break;
        
      case 'dashboard.html':
        const metrics = {
          colaboradoresAtivos: document.querySelector('.metric-colaboradores')?.textContent?.trim(),
          trilhasConcluidas: document.querySelector('.metric-trilhas')?.textContent?.trim(),
          sentimentMedio: document.querySelector('.metric-sentimento')?.textContent?.trim()
        };
        context.metrics = metrics;
        break;
    }
    
    return context;
  }
}

// Inicializar integração quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
  // Aguardar um pouco para garantir que outros scripts carregaram
  setTimeout(() => {
    if (!window.chatIntegration) {
      window.chatIntegration = new ChatIntegration();
      console.log('🔗 Chat Integration inicializada');
    }
  }, 1000);
});

// Exportar para uso global
window.ChatIntegration = ChatIntegration;
