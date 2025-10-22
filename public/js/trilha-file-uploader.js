/**
 * Componente de Upload de Arquivos para Trilhas
 * Suporte a drag-and-drop, preview e validação
 */

class TrilhaFileUploader {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      maxFiles: options.maxFiles || 10,
      maxSize: options.maxSize || 100 * 1024 * 1024, // 100MB
      allowedTypes: options.allowedTypes || [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'video/mp4',
        'video/avi',
        'video/quicktime',
        'video/x-msvideo',
        'text/plain',
        'application/rtf',
        'image/jpeg',
        'image/png',
        'image/gif'
      ],
      tipoConteudo: options.tipoConteudo || 'documento',
      trilhaId: options.trilhaId || null,
      onUploadComplete: options.onUploadComplete || (() => {}),
      onUploadError: options.onUploadError || (() => {}),
      onFileAdded: options.onFileAdded || (() => {}),
      onFileRemoved: options.onFileRemoved || (() => {})
    };
    
    this.files = [];
    this.uploading = false;
    
    this.init();
  }
  
  init() {
    this.createHTML();
    this.bindEvents();
    this.updateUI();
  }
  
  createHTML() {
    this.container.innerHTML = `
      <div class="trilha-uploader">
        <div class="upload-dropzone" id="dropzone-${this.container.id}">
          <div class="upload-content">
            <i class="fas fa-cloud-upload-alt upload-icon"></i>
            <h3>Arraste arquivos aqui ou clique para selecionar</h3>
            <p>Tipos suportados: PDF, DOC, DOCX, MP4, AVI, TXT, RTF, JPG, PNG, GIF</p>
            <p>Tamanho máximo: ${this.formatFileSize(this.options.maxSize)}</p>
            <input type="file" id="file-input-${this.container.id}" multiple accept="${this.options.allowedTypes.join(',')}" style="display: none;">
            <button type="button" class="btn btn-primary" onclick="document.getElementById('file-input-${this.container.id}').click()">
              <i class="fas fa-plus"></i> Selecionar Arquivos
            </button>
          </div>
        </div>
        
        <div class="upload-progress" id="progress-${this.container.id}" style="display: none;">
          <div class="progress">
            <div class="progress-bar" role="progressbar" style="width: 0%"></div>
          </div>
          <div class="progress-text">Preparando upload...</div>
        </div>
        
        <div class="upload-files" id="files-${this.container.id}">
          <!-- Arquivos serão listados aqui -->
        </div>
        
        <div class="upload-actions" id="actions-${this.container.id}" style="display: none;">
          <button type="button" class="btn btn-success" id="upload-btn-${this.container.id}">
            <i class="fas fa-upload"></i> Fazer Upload
          </button>
          <button type="button" class="btn btn-secondary" id="clear-btn-${this.container.id}">
            <i class="fas fa-trash"></i> Limpar Todos
          </button>
        </div>
      </div>
    `;
    
    this.addStyles();
  }
  
  addStyles() {
    if (document.getElementById('trilha-uploader-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'trilha-uploader-styles';
    styles.textContent = `
      .trilha-uploader {
        border: 2px dashed #dee2e6;
        border-radius: 8px;
        padding: 20px;
        background: #f8f9fa;
        transition: all 0.3s ease;
      }
      
      .trilha-uploader.drag-over {
        border-color: #007bff;
        background: #e3f2fd;
      }
      
      .upload-dropzone {
        text-align: center;
        padding: 40px 20px;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      
      .upload-dropzone:hover {
        background: #e9ecef;
        border-radius: 8px;
      }
      
      .upload-icon {
        font-size: 48px;
        color: #6c757d;
        margin-bottom: 16px;
      }
      
      .upload-content h3 {
        color: #495057;
        margin-bottom: 8px;
      }
      
      .upload-content p {
        color: #6c757d;
        font-size: 14px;
        margin-bottom: 4px;
      }
      
      .upload-progress {
        margin: 20px 0;
      }
      
      .progress {
        height: 20px;
        background: #e9ecef;
        border-radius: 10px;
        overflow: hidden;
      }
      
      .progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #007bff, #0056b3);
        transition: width 0.3s ease;
      }
      
      .progress-text {
        text-align: center;
        margin-top: 8px;
        font-weight: 500;
        color: #495057;
      }
      
      .upload-files {
        margin: 20px 0;
      }
      
      .file-item {
        display: flex;
        align-items: center;
        padding: 12px;
        background: white;
        border: 1px solid #dee2e6;
        border-radius: 6px;
        margin-bottom: 8px;
        transition: all 0.3s ease;
      }
      
      .file-item:hover {
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      
      .file-item.uploading {
        opacity: 0.7;
        background: #f8f9fa;
      }
      
      .file-item.success {
        border-color: #28a745;
        background: #f8fff9;
      }
      
      .file-item.error {
        border-color: #dc3545;
        background: #fff8f8;
      }
      
      .file-icon {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #e9ecef;
        border-radius: 6px;
        margin-right: 12px;
        font-size: 18px;
        color: #6c757d;
      }
      
      .file-info {
        flex: 1;
      }
      
      .file-name {
        font-weight: 500;
        color: #495057;
        margin-bottom: 4px;
      }
      
      .file-size {
        font-size: 12px;
        color: #6c757d;
      }
      
      .file-status {
        margin-left: 12px;
        font-size: 12px;
        padding: 4px 8px;
        border-radius: 4px;
        font-weight: 500;
      }
      
      .file-status.pending {
        background: #fff3cd;
        color: #856404;
      }
      
      .file-status.uploading {
        background: #cce5ff;
        color: #004085;
      }
      
      .file-status.success {
        background: #d4edda;
        color: #155724;
      }
      
      .file-status.error {
        background: #f8d7da;
        color: #721c24;
      }
      
      .file-actions {
        margin-left: 12px;
      }
      
      .file-actions button {
        background: none;
        border: none;
        color: #6c757d;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.3s ease;
      }
      
      .file-actions button:hover {
        background: #e9ecef;
        color: #495057;
      }
      
      .file-actions button.remove:hover {
        color: #dc3545;
      }
      
      .upload-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
        margin-top: 20px;
      }
      
      .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      
      .btn-primary {
        background: #007bff;
        color: white;
      }
      
      .btn-primary:hover {
        background: #0056b3;
      }
      
      .btn-success {
        background: #28a745;
        color: white;
      }
      
      .btn-success:hover {
        background: #1e7e34;
      }
      
      .btn-secondary {
        background: #6c757d;
        color: white;
      }
      
      .btn-secondary:hover {
        background: #545b62;
      }
      
      .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    `;
    
    document.head.appendChild(styles);
  }
  
  bindEvents() {
    const dropzone = this.container.querySelector('.upload-dropzone');
    const fileInput = this.container.querySelector(`#file-input-${this.container.id}`);
    const uploadBtn = this.container.querySelector(`#upload-btn-${this.container.id}`);
    const clearBtn = this.container.querySelector(`#clear-btn-${this.container.id}`);
    
    // Drag and drop events
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.container.classList.add('drag-over');
    });
    
    dropzone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      this.container.classList.remove('drag-over');
    });
    
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.container.classList.remove('drag-over');
      this.handleFiles(e.dataTransfer.files);
    });
    
    // File input change
    fileInput.addEventListener('change', (e) => {
      this.handleFiles(e.target.files);
    });
    
    // Upload button
    uploadBtn.addEventListener('click', () => {
      this.uploadFiles();
    });
    
    // Clear button
    clearBtn.addEventListener('click', () => {
      this.clearFiles();
    });
  }
  
  handleFiles(fileList) {
    const newFiles = Array.from(fileList);
    
    // Validar número máximo de arquivos
    if (this.files.length + newFiles.length > this.options.maxFiles) {
      this.showError(`Máximo de ${this.options.maxFiles} arquivos permitidos`);
      return;
    }
    
    // Validar cada arquivo
    for (const file of newFiles) {
      if (!this.validateFile(file)) {
        continue;
      }
      
      // Verificar se arquivo já existe
      if (this.files.some(f => f.name === file.name && f.size === file.size)) {
        this.showError(`Arquivo "${file.name}" já foi adicionado`);
        continue;
      }
      
      this.addFile(file);
    }
    
    this.updateUI();
  }
  
  validateFile(file) {
    // Validar tamanho
    if (file.size > this.options.maxSize) {
      this.showError(`Arquivo "${file.name}" excede o tamanho máximo de ${this.formatFileSize(this.options.maxSize)}`);
      return false;
    }
    
    // Validar tipo
    if (!this.options.allowedTypes.includes(file.type)) {
      this.showError(`Tipo de arquivo "${file.type}" não é suportado`);
      return false;
    }
    
    return true;
  }
  
  addFile(file) {
    const fileObj = {
      id: Date.now() + Math.random(),
      file: file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending',
      url: null,
      error: null
    };
    
    this.files.push(fileObj);
    this.options.onFileAdded(fileObj);
  }
  
  removeFile(fileId) {
    const index = this.files.findIndex(f => f.id === fileId);
    if (index !== -1) {
      const file = this.files[index];
      this.files.splice(index, 1);
      this.options.onFileRemoved(file);
      this.updateUI();
    }
  }
  
  clearFiles() {
    this.files = [];
    this.updateUI();
  }
  
  async uploadFiles() {
    if (this.files.length === 0) return;
    
    this.uploading = true;
    this.updateUI();
    
    const formData = new FormData();
    this.files.forEach(fileObj => {
      formData.append('arquivos', fileObj.file);
    });
    
    formData.append('tipo_conteudo', this.options.tipoConteudo);
    if (this.options.trilhaId) {
      formData.append('trilha_id', this.options.trilhaId);
    }
    
    try {
      this.updateProgress(0, 'Iniciando upload...');
      
      const response = await fetch('/api/upload/arquivos-trilha-lote', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.updateProgress(100, 'Upload concluído!');
        
        // Atualizar status dos arquivos
        result.uploaded_files.forEach((uploadedFile, index) => {
          const fileObj = this.files[index];
          if (fileObj) {
            fileObj.status = 'success';
            fileObj.url = uploadedFile.url;
            fileObj.uploadedId = uploadedFile.id;
            fileObj.originalFile = fileObj.file; // Manter referência ao arquivo original
          }
        });
        
        // Marcar erros
        result.errors.forEach(error => {
          const fileObj = this.files.find(f => f.name === error.file);
          if (fileObj) {
            fileObj.status = 'error';
            fileObj.error = error.error;
          }
        });
        
        this.options.onUploadComplete(result);
        
        setTimeout(() => {
          this.hideProgress();
        }, 2000);
        
      } else {
        throw new Error(result.error || 'Erro no upload');
      }
      
    } catch (error) {
      console.error('Erro no upload:', error);
      this.showError(`Erro no upload: ${error.message}`);
      this.options.onUploadError(error);
      
      // Marcar todos como erro
      this.files.forEach(fileObj => {
        if (fileObj.status === 'uploading') {
          fileObj.status = 'error';
          fileObj.error = error.message;
        }
      });
      
    } finally {
      this.uploading = false;
      this.updateUI();
    }
  }
  
  updateProgress(percent, text) {
    const progressContainer = this.container.querySelector('.upload-progress');
    const progressBar = this.container.querySelector('.progress-bar');
    const progressText = this.container.querySelector('.progress-text');
    
    progressContainer.style.display = 'block';
    progressBar.style.width = `${percent}%`;
    progressText.textContent = text;
  }
  
  hideProgress() {
    const progressContainer = this.container.querySelector('.upload-progress');
    progressContainer.style.display = 'none';
  }
  
  updateUI() {
    const filesContainer = this.container.querySelector('.upload-files');
    const actionsContainer = this.container.querySelector('.upload-actions');
    
    // Atualizar lista de arquivos
    filesContainer.innerHTML = '';
    
    this.files.forEach(fileObj => {
      const fileItem = document.createElement('div');
      fileItem.className = `file-item ${fileObj.status}`;
      
      const icon = this.getFileIcon(fileObj.type);
      const statusText = this.getStatusText(fileObj.status);
      
      fileItem.innerHTML = `
        <div class="file-icon">
          <i class="${icon}"></i>
        </div>
        <div class="file-info">
          <div class="file-name">${fileObj.name}</div>
          <div class="file-size">${this.formatFileSize(fileObj.size)}</div>
        </div>
        <div class="file-status ${fileObj.status}">${statusText}</div>
        <div class="file-actions">
          ${fileObj.status === 'success' && fileObj.url ? 
            `<button onclick="window.open('${fileObj.url}', '_blank')" title="Visualizar">
              <i class="fas fa-eye"></i>
            </button>` : ''
          }
          <button class="remove" onclick="uploader.removeFile(${fileObj.id})" title="Remover">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      
      filesContainer.appendChild(fileItem);
    });
    
    // Mostrar/ocultar ações
    if (this.files.length > 0) {
      actionsContainer.style.display = 'flex';
    } else {
      actionsContainer.style.display = 'none';
    }
    
    // Atualizar botão de upload
    const uploadBtn = this.container.querySelector(`#upload-btn-${this.container.id}`);
    const pendingFiles = this.files.filter(f => f.status === 'pending');
    
    uploadBtn.disabled = this.uploading || pendingFiles.length === 0;
    uploadBtn.innerHTML = this.uploading ? 
      '<i class="fas fa-spinner fa-spin"></i> Fazendo Upload...' :
      '<i class="fas fa-upload"></i> Fazer Upload';
  }
  
  getFileIcon(mimeType) {
    if (mimeType.startsWith('video/')) return 'fas fa-video';
    if (mimeType.startsWith('image/')) return 'fas fa-image';
    if (mimeType.includes('pdf')) return 'fas fa-file-pdf';
    if (mimeType.includes('word')) return 'fas fa-file-word';
    if (mimeType.includes('text')) return 'fas fa-file-alt';
    return 'fas fa-file';
  }
  
  getStatusText(status) {
    const statusMap = {
      'pending': 'Pendente',
      'uploading': 'Enviando...',
      'success': 'Concluído',
      'error': 'Erro'
    };
    return statusMap[status] || status;
  }
  
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  showError(message) {
    // Implementar sistema de notificações
    console.error('Upload Error:', message);
    alert(message); // Temporário - substituir por sistema de notificações
  }
  
  // Métodos públicos
  getFiles() {
    return this.files;
  }
  
  getUploadedFiles() {
    return this.files.filter(f => f.status === 'success');
  }
  
  reset() {
    this.files = [];
    this.uploading = false;
    this.updateUI();
    this.hideProgress();
  }
}

// Exportar para uso global
window.TrilhaFileUploader = TrilhaFileUploader;
