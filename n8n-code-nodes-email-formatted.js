/**
 * N8N Code Node - Formatação de Links para Email
 * 
 * Substitua o código atual dos Code nodes do N8N por este código melhorado
 * que formata automaticamente todos os links para Email com templates HTML profissionais.
 */

// ===================================================================
// SISTEMA DE FORMATAÇÃO DE LINKS PARA EMAIL
// ===================================================================

class EmailLinkFormatter {
  constructor() {
    this.icones = {
      'dashboard': '📱',
      'documento': '📄',
      'video': '🎥',
      'trilha': '🎯',
      'quiz': '📝',
      'slack': '💬',
      'telegram': '📱',
      'external': '🔗',
      'pdf': '📄',
      'youtube': '🎥',
      'drive': '☁️',
      'confluence': '📚',
      'notion': '📝'
    };
    
    this.cores = {
      'dashboard': '#17A2B8',    // Accent Teal
      'documento': '#6C757D',   // Brand Medium Grey
      'video': '#DC3545',       // Red
      'trilha': '#28A745',      // Success Green
      'quiz': '#FFC107',        // Warning Yellow
      'slack': '#4A154B',       // Slack Purple
      'telegram': '#0088CC',    // Telegram Blue
      'pdf': '#E74C3C',         // Red
      'youtube': '#FF0000',     // YouTube Red
      'drive': '#4285F4',       // Google Blue
      'confluence': '#172B4D',  // Confluence Blue
      'notion': '#000000',      // Notion Black
      'external': '#343A40'     // Brand Dark Grey
    };
  }

  detectarTipoLink(url) {
    if (!url) return 'external';
    
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('dashboard') || urlLower.includes('colaborador-dashboard')) return 'dashboard';
    if (urlLower.includes('trilha') || urlLower.includes('trail')) return 'trilha';
    if (urlLower.includes('quiz') || urlLower.includes('test')) return 'quiz';
    if (urlLower.includes('slack://') || urlLower.includes('slack.com')) return 'slack';
    if (urlLower.includes('t.me') || urlLower.includes('telegram')) return 'telegram';
    if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) return 'youtube';
    if (urlLower.includes('drive.google.com') || urlLower.includes('docs.google.com')) return 'drive';
    if (urlLower.includes('confluence')) return 'confluence';
    if (urlLower.includes('notion.so') || urlLower.includes('notion.site')) return 'notion';
    if (urlLower.includes('.pdf')) return 'pdf';
    if (urlLower.includes('.mp4') || urlLower.includes('.avi') || urlLower.includes('vimeo.com')) return 'video';
    if (urlLower.includes('.doc') || urlLower.includes('.docx') || urlLower.includes('.txt')) return 'documento';
    
    return 'external';
  }

  formatarLink(url, titulo = null, descricao = null) {
    const tipo = this.detectarTipoLink(url);
    const icone = this.icones[tipo];
    const cor = this.cores[tipo];
    const tituloFinal = titulo || this.getTituloPadrao(tipo);
    
    const dicas = {
      'dashboard': '💡 Clique no botão acima para acompanhar seu progresso',
      'documento': '💡 Clique no botão acima para visualizar o documento',
      'video': '💡 Clique no botão acima para assistir o vídeo',
      'trilha': '💡 Clique no botão acima para começar a trilha',
      'quiz': '💡 Clique no botão acima para fazer o quiz',
      'slack': '💡 Clique no botão acima para abrir no Slack',
      'telegram': '💡 Clique no botão acima para abrir no Telegram',
      'pdf': '💡 Clique no botão acima para baixar o PDF',
      'youtube': '💡 Clique no botão acima para assistir no YouTube',
      'drive': '💡 Clique no botão acima para abrir no Google Drive',
      'confluence': '💡 Clique no botão acima para acessar no Confluence',
      'notion': '💡 Clique no botão acima para abrir no Notion',
      'external': '💡 Clique no botão acima para abrir o link'
    };
    
    const dica = dicas[tipo] || dicas['external'];
    
    return `
      <div style="text-align: center; margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid ${cor};">
        <h3 style="color: #343A40; margin-bottom: 10px; font-family: 'Roboto', sans-serif; font-size: 18px; font-weight: 600;">
          ${icone} ${tituloFinal}
        </h3>
        <a href="${url}" 
           style="background: ${cor}; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; 
                  display: inline-block; font-weight: 500; font-family: 'Roboto', sans-serif;
                  transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          🔗 Abrir Link
        </a>
        ${descricao ? `
          <p style="margin-top: 15px; color: #6C757D; font-size: 14px; line-height: 1.4; font-family: 'Roboto', sans-serif;">
            📝 ${descricao}
          </p>
        ` : ''}
        <p style="margin-top: 10px; color: #6C757D; font-size: 12px; font-style: italic; font-family: 'Roboto', sans-serif;">
          ${dica}
        </p>
      </div>
    `;
  }

  getTituloPadrao(tipo) {
    const titulos = {
      'dashboard': 'Painel Pessoal',
      'documento': 'Documento',
      'video': 'Vídeo',
      'trilha': 'Trilha',
      'quiz': 'Quiz',
      'slack': 'Chat Slack',
      'telegram': 'Chat Telegram',
      'external': 'Link Externo',
      'pdf': 'PDF',
      'youtube': 'Vídeo YouTube',
      'drive': 'Google Drive',
      'confluence': 'Confluence',
      'notion': 'Notion'
    };
    
    return titulos[tipo] || 'Link Externo';
  }

  // Criar template de email completo
  criarTemplateEmail(titulo, conteudo, links = []) {
    let html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${titulo}</title>
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700&family=Roboto:wght@400;500&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Roboto', sans-serif;
            line-height: 1.6;
            color: #343A40;
            background-color: #f8f9fa;
            margin: 0;
            padding: 20px;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .email-header {
            background: #17A2B8;
            color: white;
            padding: 20px;
            text-align: center;
          }
          .email-header h1 {
            margin: 0;
            font-family: 'Montserrat', sans-serif;
            font-size: 24px;
            font-weight: 700;
          }
          .email-body {
            padding: 30px;
          }
          .email-footer {
            background: #343A40;
            color: white;
            padding: 20px;
            text-align: center;
            font-size: 12px;
          }
          .email-footer a {
            color: #17A2B8;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <h1>${titulo}</h1>
          </div>
          <div class="email-body">
            ${conteudo}
    `;
    
    // Adicionar links se fornecidos
    if (links.length > 0) {
      html += '<div style="margin-top: 30px;">';
      links.forEach(link => {
        html += this.formatarLink(link.url, link.titulo, link.descricao);
      });
      html += '</div>';
    }
    
    html += `
          </div>
          <div class="email-footer">
            <p>Este email foi enviado automaticamente pelo sistema Navigator.</p>
            <p>Para suporte, entre em contato conosco.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return html;
  }
}

// ===================================================================
// CÓDIGO PARA CODE NODES DO N8N - EMAIL
// ===================================================================

// Instanciar o formatador
const emailFormatter = new EmailLinkFormatter();

// ===================================================================
// 1️⃣ CODE NODE: Formatar Email - Trilha Iniciada
// ===================================================================

const webhookData = $input.first().json.body;

const titulo = `🚀 Nova Trilha Iniciada - ${webhookData.trilha_nome}`;

const conteudo = `
  <p>Olá <strong>${webhookData.colaborador_nome}</strong>!</p>
  
  <p>🎉 <strong>Parabéns!</strong> Você iniciou uma nova trilha de onboarding:</p>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="color: #17A2B8; margin-top: 0;">📚 ${webhookData.trilha_nome}</h3>
    <p><strong>⏰ Prazo:</strong> ${webhookData.prazo_dias} dias</p>
    <p><strong>📅 Data limite:</strong> ${new Date(webhookData.data_limite).toLocaleDateString('pt-BR')}</p>
  </div>
  
  <p>💡 <strong>Dica:</strong> Comece pelos conteúdos obrigatórios e não esqueça do prazo!</p>
  <p>📚 <strong>Bons estudos!</strong></p>
`;

const links = [{
  url: `https://navigator-gules.vercel.app/colaborador-dashboard.html?colaborador_id=${webhookData.colaborador_id}&tenant=${$('Merge').first().json.tenantId}`,
  titulo: 'Painel Pessoal',
  descricao: 'Acesse para acompanhar seu progresso na trilha'
}];

const emailHTML = emailFormatter.criarTemplateEmail(titulo, conteudo, links);

return [{
  json: {
    subject: titulo,
    html: emailHTML,
    to: webhookData.colaborador_email,
    from: 'navigator@empresa.com'
  }
}];

// ===================================================================
// 2️⃣ CODE NODE: Formatar Email - Quiz Disponível
// ===================================================================

const webhookData = $input.first().json.body;

const titulo = `🎉 Quiz Disponível - ${webhookData.trilha_nome}`;

const conteudo = `
  <p>Olá <strong>${webhookData.colaborador_nome}</strong>!</p>
  
  <p>✅ <strong>Parabéns!</strong> Você concluiu todos os conteúdos da trilha:</p>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="color: #28A745; margin-top: 0;">📚 ${webhookData.trilha_nome}</h3>
    <p>🎯 <strong>Objetivo:</strong> Aprovação com 60% ou mais</p>
  </div>
  
  <p>📝 <strong>Agora é hora do quiz!</strong></p>
  <p>💡 <strong>Dica:</strong> Leia com calma e boa sorte! 🍀</p>
`;

const links = [{
  url: `https://navigator-gules.vercel.app/colaborador-dashboard.html?colaborador_id=${webhookData.colaborador_id}&tenant=${$('Merge').first().json.tenantId}`,
  titulo: 'Painel Pessoal',
  descricao: 'Acesse para fazer o quiz'
}];

const emailHTML = emailFormatter.criarTemplateEmail(titulo, conteudo, links);

return [{
  json: {
    subject: titulo,
    html: emailHTML,
    to: webhookData.colaborador_email,
    from: 'navigator@empresa.com'
  }
}];

// ===================================================================
// 3️⃣ CODE NODE: Formatar Email - Trilha Concluída
// ===================================================================

const webhookData = $input.first().json.body;

const titulo = `🏆 Trilha Concluída - ${webhookData.trilha_nome}`;

const conteudo = `
  <p>Olá <strong>${webhookData.colaborador_nome}</strong>!</p>
  
  <p>🎉 <strong>Parabéns!</strong> Você concluiu com sucesso a trilha:</p>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="color: #28A745; margin-top: 0;">📚 ${webhookData.trilha_nome}</h3>
    <p><strong>📊 Sua pontuação:</strong> ${webhookData.nota || 'N/A'}%</p>
    <p><strong>⭐ Pontos ganhos:</strong> ${webhookData.pontos || 'N/A'}</p>
  </div>
  
  <p>🚀 <strong>Continue assim!</strong> Você está indo muito bem!</p>
`;

const links = [{
  url: `https://navigator-gules.vercel.app/colaborador-dashboard.html?colaborador_id=${webhookData.colaborador_id}&tenant=${$('Merge').first().json.tenantId}`,
  titulo: 'Painel Pessoal',
  descricao: 'Veja seu progresso completo'
}];

const emailHTML = emailFormatter.criarTemplateEmail(titulo, conteudo, links);

return [{
  json: {
    subject: titulo,
    html: emailHTML,
    to: webhookData.colaborador_email,
    from: 'navigator@empresa.com'
  }
}];

// ===================================================================
// 4️⃣ CODE NODE: Formatar Email - Onboarding Completo
// ===================================================================

const webhookData = $input.first().json.body;

const titulo = `🎊 Onboarding Completo - ${webhookData.colaborador_nome}`;

const conteudo = `
  <p>Olá <strong>${webhookData.colaborador_nome}</strong>!</p>
  
  <p>🎊 <strong>Parabéns!</strong> Você concluiu com sucesso todo o processo de onboarding!</p>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="color: #28A745; margin-top: 0;">🏆 Onboarding Completo</h3>
    <p><strong>📚 Trilhas concluídas:</strong> ${webhookData.total_trilhas || 'N/A'}</p>
    <p><strong>⭐ Pontos totais:</strong> ${webhookData.pontos_totais || 'N/A'}</p>
    <p><strong>📊 Média geral:</strong> ${webhookData.media_geral || 'N/A'}%</p>
  </div>
  
  <p>🎉 <strong>Bem-vindo à equipe!</strong> Você está oficialmente integrado!</p>
  <p>💼 <strong>Próximos passos:</strong> Entre em contato com seu gestor para as próximas atividades.</p>
`;

const links = [{
  url: `https://navigator-gules.vercel.app/colaborador-dashboard.html?colaborador_id=${webhookData.colaborador_id}&tenant=${$('Merge').first().json.tenantId}`,
  titulo: 'Painel Pessoal',
  descricao: 'Veja seu progresso completo e certificado'
}];

const emailHTML = emailFormatter.criarTemplateEmail(titulo, conteudo, links);

return [{
  json: {
    subject: titulo,
    html: emailHTML,
    to: webhookData.colaborador_email,
    from: 'navigator@empresa.com'
  }
}];

// ===================================================================
// 5️⃣ CODE NODE: Formatar Email - Alerta de Atraso
// ===================================================================

const webhookData = $input.first().json.body;

const titulo = `⚠️ Alerta de Atraso - ${webhookData.trilha_nome}`;

const conteudo = `
  <p>Olá <strong>${webhookData.colaborador_nome}</strong>!</p>
  
  <p>⚠️ <strong>Atenção!</strong> Você tem uma trilha em atraso:</p>
  
  <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
    <h3 style="color: #856404; margin-top: 0;">📚 ${webhookData.trilha_nome}</h3>
    <p><strong>📅 Data limite:</strong> ${new Date(webhookData.data_limite).toLocaleDateString('pt-BR')}</p>
    <p><strong>⏰ Dias em atraso:</strong> ${webhookData.dias_atraso || 'N/A'}</p>
  </div>
  
  <p>🚨 <strong>Importante:</strong> Complete a trilha o quanto antes para evitar problemas.</p>
  <p>💡 <strong>Dica:</strong> Entre em contato com seu gestor se precisar de ajuda.</p>
`;

const links = [{
  url: `https://navigator-gules.vercel.app/colaborador-dashboard.html?colaborador_id=${webhookData.colaborador_id}&tenant=${$('Merge').first().json.tenantId}`,
  titulo: 'Painel Pessoal',
  descricao: 'Acesse para continuar a trilha'
}];

const emailHTML = emailFormatter.criarTemplateEmail(titulo, conteudo, links);

return [{
  json: {
    subject: titulo,
    html: emailHTML,
    to: webhookData.colaborador_email,
    from: 'navigator@empresa.com'
  }
}];

// ===================================================================
// 6️⃣ CODE NODE: Formatar Email - Alerta de Nota Baixa
// ===================================================================

const webhookData = $input.first().json.body;

const titulo = `📉 Alerta de Nota Baixa - ${webhookData.trilha_nome}`;

const conteudo = `
  <p>Olá <strong>${webhookData.colaborador_nome}</strong>!</p>
  
  <p>📉 <strong>Atenção!</strong> Você teve uma nota baixa no quiz:</p>
  
  <div style="background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
    <h3 style="color: #721c24; margin-top: 0;">📚 ${webhookData.trilha_nome}</h3>
    <p><strong>📊 Sua nota:</strong> ${webhookData.nota || 'N/A'}%</p>
    <p><strong>🎯 Nota mínima:</strong> 60%</p>
  </div>
  
  <p>🔄 <strong>Próximos passos:</strong> Você pode refazer o quiz para melhorar sua nota.</p>
  <p>💡 <strong>Dica:</strong> Revise os conteúdos antes de tentar novamente.</p>
`;

const links = [{
  url: `https://navigator-gules.vercel.app/colaborador-dashboard.html?colaborador_id=${webhookData.colaborador_id}&tenant=${$('Merge').first().json.tenantId}`,
  titulo: 'Painel Pessoal',
  descricao: 'Acesse para refazer o quiz'
}];

const emailHTML = emailFormatter.criarTemplateEmail(titulo, conteudo, links);

return [{
  json: {
    subject: titulo,
    html: emailHTML,
    to: webhookData.colaborador_email,
    from: 'navigator@empresa.com'
  }
}];
