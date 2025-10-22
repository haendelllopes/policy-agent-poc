/**
 * Controlador do Formulário Unificado de Trilhas
 * Gerencia criação de trilhas com múltiplos conteúdos em uma única tela
 */

class TrilhaFormularioUnificado {
  constructor() {
    this.conteudos = [];
    this.uploader = null;
    this.modal = null;
    this.conteudoEditando = null;
    
    this.init();
  }
  
  init() {
    this.modal = new bootstrap.Modal(document.getElementById('modal-conteudo'));
    this.loadDepartamentos();
    this.loadCargos();
    this.bindEvents();
    this.updateConteudoCounter();
  }
  
  bindEvents() {
    // Formulário principal
    document.getElementById('form-trilha-completa').addEventListener('submit', (e) => {
      e.preventDefault();
      this.salvarTrilhaCompleta();
    });
    
    // Modal de conteúdo
    document.getElementById('tipo-conteudo').addEventListener('change', (e) => {
      this.toggleConteudoFields(e.target.value);
    });
    
    // Auto-incrementar ordem
    document.getElementById('ordem-conteudo').addEventListener('input', (e) => {
      this.autoIncrementarOrdem();
    });
  }
  
  async loadDepartamentos() {
    try {
      const response = await fetch('/api/departments');
      const data = await response.json();
      
      const select = document.getElementById('departamento-trilha');
      select.innerHTML = '<option value="">Selecione um departamento</option>';
      
      data.departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept.id;
        option.textContent = dept.nome;
        select.appendChild(option);
      });
    } catch (error) {
      console.error('Erro ao carregar departamentos:', error);
    }
  }
  
  async loadCargos() {
    try {
      const response = await fetch('/api/positions');
      const data = await response.json();
      
      const select = document.getElementById('cargo-trilha');
      select.innerHTML = '<option value="">Selecione um cargo</option>';
      
      data.positions.forEach(cargo => {
        const option = document.createElement('option');
        option.value = cargo.id;
        option.textContent = cargo.nome;
        select.appendChild(option);
      });
    } catch (error) {
      console.error('Erro ao carregar cargos:', error);
    }
  }
  
  toggleConteudoFields(tipo) {
    const uploadContainer = document.getElementById('upload-container');
    const urlContainer = document.getElementById('url-container');
    
    // Ocultar todos
    uploadContainer.style.display = 'none';
    urlContainer.style.display = 'none';
    
    // Mostrar campos apropriados
    if (tipo === 'documento' || tipo === 'pdf' || tipo === 'video') {
      uploadContainer.style.display = 'block';
      this.initUploader(tipo);
    } else if (tipo === 'link') {
      urlContainer.style.display = 'block';
    }
  }
  
  initUploader(tipoConteudo) {
    const container = document.getElementById('file-uploader');
    
    // Limpar uploader anterior
    container.innerHTML = '';
    
    // Criar novo uploader
    this.uploader = new TrilhaFileUploader('file-uploader', {
      maxFiles: 1,
      tipoConteudo: tipoConteudo,
      onUploadComplete: (result) => {
        console.log('Upload concluído:', result);
        this.showAlert('success', 'Arquivo uploadado com sucesso!');
      },
      onUploadError: (error) => {
        console.error('Erro no upload:', error);
        this.showAlert('danger', `Erro no upload: ${error.message}`);
      }
    });
  }
  
  adicionarConteudo() {
    this.conteudoEditando = null;
    this.limparFormularioConteudo();
    this.modal.show();
  }
  
  editarConteudo(index) {
    this.conteudoEditando = index;
    const conteudo = this.conteudos[index];
    
    // Preencher formulário
    document.getElementById('conteudo-index').value = index;
    document.getElementById('tipo-conteudo').value = conteudo.tipo;
    document.getElementById('titulo-conteudo').value = conteudo.titulo;
    document.getElementById('descricao-conteudo').value = conteudo.descricao || '';
    document.getElementById('ordem-conteudo').value = conteudo.ordem;
    document.getElementById('obrigatorio-conteudo').checked = conteudo.obrigatorio || false;
    
    if (conteudo.url) {
      document.getElementById('url-conteudo').value = conteudo.url;
    }
    
    // Atualizar campos visíveis
    this.toggleConteudoFields(conteudo.tipo);
    
    // Se tem arquivo, mostrar info
    if (conteudo.arquivo) {
      const uploadContainer = document.getElementById('upload-container');
      uploadContainer.innerHTML = `
        <div class="alert alert-info">
          <i class="fas fa-file"></i> Arquivo atual: ${conteudo.arquivo.name}
          <button type="button" class="btn btn-sm btn-outline-danger ms-2" onclick="trilhaFormulario.removerArquivoConteudo()">
            <i class="fas fa-trash"></i> Remover
          </button>
        </div>
      `;
    }
    
    this.modal.show();
  }
  
  removerConteudo(index) {
    if (confirm('Tem certeza que deseja remover este conteúdo?')) {
      this.conteudos.splice(index, 1);
      this.renderConteudos();
      this.updateConteudoCounter();
    }
  }
  
  removerArquivoConteudo() {
    if (this.conteudoEditando !== null) {
      this.conteudos[this.conteudoEditando].arquivo = null;
      this.conteudos[this.conteudoEditando].url = null;
    }
    
    // Recriar uploader
    const tipo = document.getElementById('tipo-conteudo').value;
    if (tipo) {
      this.toggleConteudoFields(tipo);
    }
  }
  
  salvarConteudo() {
    const form = document.getElementById('form-conteudo');
    const formData = new FormData(form);
    
    const conteudo = {
      tipo: formData.get('tipo'),
      titulo: formData.get('titulo'),
      descricao: formData.get('descricao'),
      ordem: parseInt(formData.get('ordem')) || 1,
      obrigatorio: formData.has('obrigatorio'),
      url: formData.get('url') || null,
      arquivo: null
    };
    
    // Validar campos obrigatórios
    if (!conteudo.tipo || !conteudo.titulo) {
      this.showAlert('danger', 'Tipo e título são obrigatórios');
      return;
    }
    
    // Validar URL para links
    if (conteudo.tipo === 'link' && !conteudo.url) {
      this.showAlert('danger', 'URL é obrigatória para links');
      return;
    }
    
    // Validar arquivo para documentos/vídeos
    if ((conteudo.tipo === 'documento' || conteudo.tipo === 'pdf' || conteudo.tipo === 'video') && !conteudo.url) {
      if (this.uploader && this.uploader.getUploadedFiles().length > 0) {
        const arquivo = this.uploader.getUploadedFiles()[0];
        conteudo.arquivo = arquivo;
        conteudo.url = arquivo.url;
      } else {
        this.showAlert('danger', 'Arquivo é obrigatório para documentos e vídeos');
        return;
      }
    }
    
    // Salvar ou atualizar
    if (this.conteudoEditando !== null) {
      this.conteudos[this.conteudoEditando] = conteudo;
    } else {
      this.conteudos.push(conteudo);
    }
    
    this.modal.hide();
    this.renderConteudos();
    this.updateConteudoCounter();
    this.limparFormularioConteudo();
  }
  
  limparFormularioConteudo() {
    document.getElementById('form-conteudo').reset();
    document.getElementById('conteudo-index').value = '';
    document.getElementById('upload-container').style.display = 'none';
    document.getElementById('url-container').style.display = 'none';
    document.getElementById('ordem-conteudo').value = this.conteudos.length + 1;
  }
  
  autoIncrementarOrdem() {
    const ordemInput = document.getElementById('ordem-conteudo');
    const valorAtual = parseInt(ordemInput.value) || 1;
    
    // Verificar se já existe conteúdo com esta ordem
    const ordemExistente = this.conteudos.find(c => c.ordem === valorAtual);
    if (ordemExistente && this.conteudoEditando === null) {
      ordemInput.value = Math.max(...this.conteudos.map(c => c.ordem), 0) + 1;
    }
  }
  
  renderConteudos() {
    const container = document.getElementById('conteudos-container');
    
    if (this.conteudos.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-plus-circle"></i>
          <h4>Nenhum conteúdo adicionado</h4>
          <p>Clique no botão abaixo para adicionar o primeiro conteúdo</p>
        </div>
      `;
      return;
    }
    
    // Ordenar por ordem
    const conteudosOrdenados = [...this.conteudos].sort((a, b) => a.ordem - b.ordem);
    
    container.innerHTML = conteudosOrdenados.map((conteudo, index) => {
      const originalIndex = this.conteudos.indexOf(conteudo);
      const badgeClass = this.getBadgeClass(conteudo.tipo);
      const icon = this.getConteudoIcon(conteudo.tipo);
      
      return `
        <div class="conteudo-item">
          <div class="conteudo-header">
            <div class="d-flex align-items-center gap-3">
              <span class="conteudo-type-badge ${badgeClass}">${conteudo.tipo}</span>
              <span class="badge bg-secondary">Ordem: ${conteudo.ordem}</span>
              ${conteudo.obrigatorio ? '<span class="badge bg-warning">Obrigatório</span>' : ''}
            </div>
            <div class="conteudo-actions">
              <button class="btn btn-sm btn-outline-primary" onclick="trilhaFormulario.editarConteudo(${originalIndex})">
                <i class="fas fa-edit"></i> Editar
              </button>
              <button class="btn btn-sm btn-outline-danger" onclick="trilhaFormulario.removerConteudo(${originalIndex})">
                <i class="fas fa-trash"></i> Remover
              </button>
            </div>
          </div>
          
          <div class="d-flex align-items-start gap-3">
            <div class="text-primary" style="font-size: 24px;">
              <i class="${icon}"></i>
            </div>
            <div class="flex-grow-1">
              <h5 class="mb-2">${conteudo.titulo}</h5>
              ${conteudo.descricao ? `<p class="text-muted mb-2">${conteudo.descricao}</p>` : ''}
              ${conteudo.url ? `
                <div class="d-flex align-items-center gap-2">
                  <i class="fas fa-link text-muted"></i>
                  <a href="${conteudo.url}" target="_blank" class="text-decoration-none">
                    ${conteudo.url.length > 50 ? conteudo.url.substring(0, 50) + '...' : conteudo.url}
                  </a>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
  
  getBadgeClass(tipo) {
    const classes = {
      'documento': 'documento',
      'pdf': 'documento',
      'video': 'video',
      'link': 'link'
    };
    return classes[tipo] || 'documento';
  }
  
  getConteudoIcon(tipo) {
    const icons = {
      'documento': 'fas fa-file-alt',
      'pdf': 'fas fa-file-pdf',
      'video': 'fas fa-video',
      'link': 'fas fa-link'
    };
    return icons[tipo] || 'fas fa-file';
  }
  
  updateConteudoCounter() {
    const counter = document.getElementById('conteudo-counter');
    counter.textContent = `${this.conteudos.length} conteúdo(s)`;
  }
  
  async salvarTrilhaCompleta() {
    const btnSalvar = document.getElementById('btn-salvar-trilha');
    const spinner = btnSalvar.querySelector('.loading-spinner');
    
    try {
      // Validar formulário
      if (!this.validarFormulario()) {
        return;
      }
      
      // Desabilitar botão e mostrar loading
      btnSalvar.disabled = true;
      spinner.classList.add('show');
      
      // Preparar dados da trilha
      const trilhaData = this.prepararDadosTrilha();
      
      // Criar trilha
      const trilhaResponse = await fetch('/api/trilhas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(trilhaData)
      });
      
      if (!trilhaResponse.ok) {
        throw new Error('Erro ao criar trilha');
      }
      
      const trilha = await trilhaResponse.json();
      console.log('Trilha criada:', trilha);
      
      // Criar conteúdos
      await this.criarConteudos(trilha.id);
      
      this.showAlert('success', 'Trilha criada com sucesso! Redirecionando...');
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        window.location.href = '/trilhas';
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao salvar trilha:', error);
      this.showAlert('danger', `Erro ao criar trilha: ${error.message}`);
    } finally {
      btnSalvar.disabled = false;
      spinner.classList.remove('show');
    }
  }
  
  validarFormulario() {
    const nome = document.getElementById('nome-trilha').value.trim();
    
    if (!nome) {
      this.showAlert('danger', 'Nome da trilha é obrigatório');
      return false;
    }
    
    if (this.conteudos.length === 0) {
      this.showAlert('danger', 'Adicione pelo menos um conteúdo');
      return false;
    }
    
    // Validar ordens únicas
    const ordens = this.conteudos.map(c => c.ordem);
    const ordensUnicas = new Set(ordens);
    if (ordens.length !== ordensUnicas.size) {
      this.showAlert('danger', 'Ordens dos conteúdos devem ser únicas');
      return false;
    }
    
    return true;
  }
  
  prepararDadosTrilha() {
    const form = document.getElementById('form-trilha-completa');
    const formData = new FormData(form);
    
    return {
      nome: formData.get('nome'),
      descricao: formData.get('descricao') || null,
      ordem: parseInt(formData.get('ordem')) || 0,
      departamento_id: formData.get('departamento_id') || null,
      cargo_id: formData.get('cargo_id') || null,
      obrigatorio: formData.has('obrigatorio')
    };
  }
  
  async criarConteudos(trilhaId) {
    const promises = this.conteudos.map(async (conteudo, index) => {
      // Se tem arquivo, usar endpoint com upload
      if (conteudo.arquivo && conteudo.arquivo.originalFile) {
        const formData = new FormData();
        formData.append('arquivo', conteudo.arquivo.originalFile);
        formData.append('tipo', conteudo.tipo);
        formData.append('titulo', conteudo.titulo);
        formData.append('descricao', conteudo.descricao || '');
        formData.append('ordem', conteudo.ordem);
        formData.append('obrigatorio', conteudo.obrigatorio);
        
        const response = await fetch(`/api/trilhas/${trilhaId}/conteudos-com-upload`, {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error(`Erro ao criar conteúdo ${index + 1} com arquivo`);
        }
        
        return response.json();
      } else {
        // Sem arquivo, usar endpoint normal
        const conteudoData = {
          tipo: conteudo.tipo,
          titulo: conteudo.titulo,
          descricao: conteudo.descricao || null,
          url: conteudo.url || null,
          ordem: conteudo.ordem,
          obrigatorio: conteudo.obrigatorio
        };
        
        const response = await fetch(`/api/trilhas/${trilhaId}/conteudos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(conteudoData)
        });
        
        if (!response.ok) {
          throw new Error(`Erro ao criar conteúdo ${index + 1}`);
        }
        
        return response.json();
      }
    });
    
    await Promise.all(promises);
    console.log(`${this.conteudos.length} conteúdos criados com sucesso`);
  }
  
  showAlert(type, message) {
    const alertContainer = document.getElementById('alert-container');
    const alertId = `alert-${Date.now()}`;
    
    const alertHTML = `
      <div class="alert alert-${type} alert-custom alert-dismissible fade show" id="${alertId}">
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `;
    
    alertContainer.innerHTML = alertHTML;
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
      const alert = document.getElementById(alertId);
      if (alert) {
        alert.remove();
      }
    }, 5000);
  }
}

// Funções globais para uso nos templates
function adicionarConteudo() {
  trilhaFormulario.adicionarConteudo();
}

function salvarConteudo() {
  trilhaFormulario.salvarConteudo();
}

// Inicializar quando a página carregar
let trilhaFormulario;
document.addEventListener('DOMContentLoaded', () => {
  trilhaFormulario = new TrilhaFormularioUnificado();
});
