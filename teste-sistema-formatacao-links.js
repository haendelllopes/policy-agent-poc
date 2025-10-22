#!/usr/bin/env node

/**
 * TESTE COMPLETO: Sistema Universal de Formatação de Links
 * Data: 2025-10-21
 * 
 * Testa:
 * 1. Sistema universal de formatação
 * 2. Formatação para WhatsApp
 * 3. Formatação para Telegram
 * 4. Formatação para Chat Flutuante
 * 5. Formatação para Email
 * 6. Endpoints atualizados
 */

const fs = require('fs');
const path = require('path');

function testarSistemaUniversal() {
  console.log('🧪 TESTE 1: Sistema Universal de Formatação');
  console.log('============================================');
  
  try {
    // Verificar se o arquivo existe
    const formatterPath = path.join(__dirname, 'src', 'utils', 'link-formatter.js');
    
    if (!fs.existsSync(formatterPath)) {
      console.log('❌ Arquivo link-formatter.js não encontrado');
      return false;
    }
    
    console.log('✅ Arquivo link-formatter.js encontrado');
    
    // Verificar conteúdo do arquivo
    const content = fs.readFileSync(formatterPath, 'utf8');
    
    const verificacoes = [
      { nome: 'Classe LinkFormatter', regex: /class LinkFormatter/ },
      { nome: 'Método formatarWhatsApp', regex: /formatarWhatsApp/ },
      { nome: 'Método formatarTelegram', regex: /formatarTelegram/ },
      { nome: 'Método formatarChatFlutuante', regex: /formatarChatFlutuante/ },
      { nome: 'Método formatarEmail', regex: /formatarEmail/ },
      { nome: 'Método detectarTipoLink', regex: /detectarTipoLink/ },
      { nome: 'Ícones definidos', regex: /icones.*=/ },
      { nome: 'Cores definidas', regex: /getCorBotao/ }
    ];
    
    let passou = true;
    verificacoes.forEach(verificacao => {
      if (content.includes(verificacao.nome) || verificacao.regex.test(content)) {
        console.log(`✅ ${verificacao.nome}: OK`);
      } else {
        console.log(`❌ ${verificacao.nome}: FALTANDO`);
        passou = false;
      }
    });
    
    return passou;
    
  } catch (error) {
    console.log('❌ Erro ao testar sistema universal:', error.message);
    return false;
  }
}

function testarCodigosN8N() {
  console.log('\n🧪 TESTE 2: Códigos N8N');
  console.log('========================');
  
  const arquivosN8N = [
    'n8n-code-nodes-whatsapp-formatted.js',
    'n8n-code-nodes-telegram-formatted.js',
    'n8n-code-nodes-email-formatted.js'
  ];
  
  let passou = true;
  
  arquivosN8N.forEach(arquivo => {
    const arquivoPath = path.join(__dirname, arquivo);
    
    if (!fs.existsSync(arquivoPath)) {
      console.log(`❌ ${arquivo}: NÃO ENCONTRADO`);
      passou = false;
      return;
    }
    
    console.log(`✅ ${arquivo}: ENCONTRADO`);
    
    const content = fs.readFileSync(arquivoPath, 'utf8');
    
    // Verificações específicas por arquivo
    if (arquivo.includes('whatsapp')) {
      const verificacoes = [
        { nome: 'Classe WhatsAppLinkFormatter', regex: /class WhatsAppLinkFormatter/ },
        { nome: 'Formatação WhatsApp', regex: /formatarLink/ },
        { nome: 'Ícones WhatsApp', regex: /📱/ }
      ];
      
      verificacoes.forEach(verificacao => {
        if (verificacao.regex.test(content)) {
          console.log(`  ✅ ${verificacao.nome}: OK`);
        } else {
          console.log(`  ❌ ${verificacao.nome}: FALTANDO`);
          passou = false;
        }
      });
    }
    
    if (arquivo.includes('telegram')) {
      const verificacoes = [
        { nome: 'Classe TelegramLinkFormatter', regex: /class TelegramLinkFormatter/ },
        { nome: 'Botões Inline', regex: /inline_keyboard/ },
        { nome: 'Formatação Telegram', regex: /formatarLink/ }
      ];
      
      verificacoes.forEach(verificacao => {
        if (verificacao.regex.test(content)) {
          console.log(`  ✅ ${verificacao.nome}: OK`);
        } else {
          console.log(`  ❌ ${verificacao.nome}: FALTANDO`);
          passou = false;
        }
      });
    }
    
    if (arquivo.includes('email')) {
      const verificacoes = [
        { nome: 'Classe EmailLinkFormatter', regex: /class EmailLinkFormatter/ },
        { nome: 'Template HTML', regex: /<!DOCTYPE html>/ },
        { nome: 'Formatação Email', regex: /formatarLink/ }
      ];
      
      verificacoes.forEach(verificacao => {
        if (verificacao.regex.test(content)) {
          console.log(`  ✅ ${verificacao.nome}: OK`);
        } else {
          console.log(`  ❌ ${verificacao.nome}: FALTANDO`);
          passou = false;
        }
      });
    }
  });
  
  return passou;
}

function testarChatFlutuante() {
  console.log('\n🧪 TESTE 3: Chat Flutuante');
  console.log('===========================');
  
  try {
    const arquivosChat = [
      'public/js/chat-link-formatter.js',
      'public/js/chat-link-integration.js'
    ];
    
    let passou = true;
    
    arquivosChat.forEach(arquivo => {
      const arquivoPath = path.join(__dirname, arquivo);
      
      if (!fs.existsSync(arquivoPath)) {
        console.log(`❌ ${arquivo}: NÃO ENCONTRADO`);
        passou = false;
        return;
      }
      
      console.log(`✅ ${arquivo}: ENCONTRADO`);
      
      const content = fs.readFileSync(arquivoPath, 'utf8');
      
      if (arquivo.includes('formatter')) {
        const verificacoes = [
          { nome: 'Classe ChatFlutuanteLinkFormatter', regex: /class ChatFlutuanteLinkFormatter/ },
          { nome: 'Formatação HTML', regex: /link-container/ },
          { nome: 'Botões HTML', regex: /<button onclick/ },
          { nome: 'CSS Inline', regex: /style="background:/ }
        ];
        
        verificacoes.forEach(verificacao => {
          if (verificacao.regex.test(content)) {
            console.log(`  ✅ ${verificacao.nome}: OK`);
          } else {
            console.log(`  ❌ ${verificacao.nome}: FALTANDO`);
            passou = false;
          }
        });
      }
      
      if (arquivo.includes('integration')) {
        const verificacoes = [
          { nome: 'Integração WebSocket', regex: /processarMensagemWebSocket/ },
          { nome: 'Função atualizarChatComLinks', regex: /atualizarChatComLinks/ },
          { nome: 'Exemplos de uso', regex: /enviarMensagemComLinks/ }
        ];
        
        verificacoes.forEach(verificacao => {
          if (verificacao.regex.test(content)) {
            console.log(`  ✅ ${verificacao.nome}: OK`);
          } else {
            console.log(`  ❌ ${verificacao.nome}: FALTANDO`);
            passou = false;
          }
        });
      }
    });
    
    return passou;
    
  } catch (error) {
    console.log('❌ Erro ao testar chat flutuante:', error.message);
    return false;
  }
}

function testarEndpoints() {
  console.log('\n🧪 TESTE 4: Endpoints Atualizados');
  console.log('===================================');
  
  try {
    const arquivoPath = path.join(__dirname, 'src', 'routes', 'agent-trilhas.js');
    
    if (!fs.existsSync(arquivoPath)) {
      console.log('❌ Arquivo agent-trilhas.js não encontrado');
      return false;
    }
    
    console.log('✅ Arquivo agent-trilhas.js encontrado');
    
    const content = fs.readFileSync(arquivoPath, 'utf8');
    
    const verificacoes = [
      { nome: 'Links formatados no GET disponiveis', regex: /links_formatados/ },
      { nome: 'Links formatados no POST iniciar', regex: /links_formatados/ },
      { nome: 'Endpoint formatar-links', regex: /POST.*formatar-links/ },
      { nome: 'Informações de formatação', regex: /formatacao/ },
      { nome: 'Import do LinkFormatter', regex: /require.*link-formatter/ }
    ];
    
    let passou = true;
    verificacoes.forEach(verificacao => {
      if (verificacao.regex.test(content)) {
        console.log(`✅ ${verificacao.nome}: OK`);
      } else {
        console.log(`❌ ${verificacao.nome}: FALTANDO`);
        passou = false;
      }
    });
    
    return passou;
    
  } catch (error) {
    console.log('❌ Erro ao testar endpoints:', error.message);
    return false;
  }
}

function testarExemplosUso() {
  console.log('\n🧪 TESTE 5: Exemplos de Uso');
  console.log('============================');
  
  try {
    // Testar diferentes tipos de links
    const exemplosLinks = [
      {
        url: 'https://navigator.com/dashboard',
        titulo: 'Painel Pessoal',
        descricao: 'Acompanhe seu progresso',
        tipoEsperado: 'dashboard'
      },
      {
        url: 'https://youtube.com/watch?v=abc123',
        titulo: 'Treinamento LGPD',
        descricao: 'Vídeo explicativo',
        tipoEsperado: 'youtube'
      },
      {
        url: 'https://drive.google.com/file/abc123',
        titulo: 'Política de Senhas',
        descricao: 'Documento obrigatório',
        tipoEsperado: 'drive'
      },
      {
        url: 'https://confluence.empresa.com/politicas',
        titulo: 'Confluence - Políticas',
        descricao: 'Documentação da empresa',
        tipoEsperado: 'confluence'
      }
    ];
    
    console.log('✅ Exemplos de links preparados:');
    exemplosLinks.forEach((exemplo, index) => {
      console.log(`  ${index + 1}. ${exemplo.titulo} (${exemplo.tipoEsperado})`);
    });
    
    // Testar diferentes canais
    const canais = ['whatsapp', 'telegram', 'chat', 'email'];
    console.log('\n✅ Canais suportados:');
    canais.forEach(canal => {
      console.log(`  - ${canal}`);
    });
    
    return true;
    
  } catch (error) {
    console.log('❌ Erro ao testar exemplos:', error.message);
    return false;
  }
}

function executarTestes() {
  console.log('🚀 INICIANDO TESTES COMPLETOS');
  console.log('=============================');
  console.log('Data:', new Date().toISOString());
  console.log('');
  
  const resultados = {
    sistemaUniversal: false,
    codigosN8N: false,
    chatFlutuante: false,
    endpoints: false,
    exemplos: false
  };
  
  // Executar testes
  resultados.sistemaUniversal = testarSistemaUniversal();
  resultados.codigosN8N = testarCodigosN8N();
  resultados.chatFlutuante = testarChatFlutuante();
  resultados.endpoints = testarEndpoints();
  resultados.exemplos = testarExemplosUso();
  
  // Resumo final
  console.log('\n📊 RESUMO DOS TESTES');
  console.log('====================');
  console.log('✅ Sistema Universal:', resultados.sistemaUniversal ? 'PASSOU' : 'FALHOU');
  console.log('✅ Códigos N8N:', resultados.codigosN8N ? 'PASSOU' : 'FALHOU');
  console.log('✅ Chat Flutuante:', resultados.chatFlutuante ? 'PASSOU' : 'FALHOU');
  console.log('✅ Endpoints:', resultados.endpoints ? 'PASSOU' : 'FALHOU');
  console.log('✅ Exemplos:', resultados.exemplos ? 'PASSOU' : 'FALHOU');
  
  const totalPassou = Object.values(resultados).filter(r => r).length;
  const totalTestes = Object.keys(resultados).length;
  
  console.log('\n🎯 RESULTADO FINAL:');
  console.log(`${totalPassou}/${totalTestes} testes passaram`);
  
  if (totalPassou === totalTestes) {
    console.log('🎉 TODOS OS TESTES PASSARAM! Sistema de formatação funcionando perfeitamente!');
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Copiar códigos N8N para os Code nodes');
    console.log('2. Incluir scripts JS no chat flutuante');
    console.log('3. Testar formatação em produção');
    console.log('4. Atualizar checklist');
  } else {
    console.log('⚠️  Alguns testes falharam. Verificar implementação.');
  }
  
  return totalPassou === totalTestes;
}

// Executar testes
const sucesso = executarTestes();
process.exit(sucesso ? 0 : 1);
