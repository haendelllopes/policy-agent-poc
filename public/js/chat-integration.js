// Integração do chat com páginas específicas - independente do sistema atual
class ChatIntegration {
  constructor() {
    this.setupPageSpecificFeatures();
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
    }
  }

  setupTrilhaDetailsIntegration() {
    // Adicionar botão "Perguntar ao Navi" na trilha
    const trilhaTitle = document.querySelector('.trilha-title');
    if (trilhaTitle) {
      const chatButton = document.createElement('button');
      chatButton.className = 'btn btn-outline-primary btn-sm';
      chatButton.innerHTML = '💬 Perguntar ao Navi';
      chatButton.onclick = () => {
        window.chatWidget.openChat();
        window.chatWidget.input.value = `Tenho dúvidas sobre a trilha "${trilhaTitle.textContent}"`;
      };
      trilhaTitle.parentNode.appendChild(chatButton);
    }
  }

  setupTrilhasIntegration() {
    // Adicionar contexto de trilhas disponíveis
    window.addEventListener('chatContextRequest', (event) => {
      const trilhas = Array.from(document.querySelectorAll('.trilha-card')).map(card => ({
        nome: card.querySelector('.trilha-nome')?.textContent,
        descricao: card.querySelector('.trilha-descricao')?.textContent,
        status: card.querySelector('.trilha-status')?.textContent
      }));
      
      event.detail.context.trilhas = trilhas;
    });
  }

  setupDashboardIntegration() {
    // Adicionar métricas do dashboard ao contexto
    window.addEventListener('chatContextRequest', (event) => {
      const metrics = {
        colaboradoresAtivos: document.querySelector('.metric-colaboradores')?.textContent,
        trilhasConcluidas: document.querySelector('.metric-trilhas')?.textContent,
        sentimentMedio: document.querySelector('.metric-sentimento')?.textContent
      };
      
      event.detail.context.metrics = metrics;
    });
  }
}

// Inicializar integração
document.addEventListener('DOMContentLoaded', () => {
  new ChatIntegration();
});