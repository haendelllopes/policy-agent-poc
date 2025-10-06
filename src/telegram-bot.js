const axios = require('axios');

class TelegramBot {
  constructor(botToken) {
    this.botToken = botToken;
    this.apiUrl = `https://api.telegram.org/bot${botToken}`;
  }

  /**
   * Enviar mensagem de texto
   */
  async sendMessage(chatId, text, options = {}) {
    try {
      const payload = {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        ...options
      };

      const response = await axios.post(`${this.apiUrl}/sendMessage`, payload);
      return response.data;
    } catch (error) {
      console.error('Erro ao enviar mensagem no Telegram:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Enviar mensagem com botões inline
   */
  async sendMessageWithButtons(chatId, text, buttons, options = {}) {
    try {
      const inlineKeyboard = {
        inline_keyboard: buttons.map(row => 
          row.map(button => ({
            text: button.text,
            callback_data: button.callback_data || button.url ? undefined : button.text,
            url: button.url
          }))
        )
      };

      const payload = {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard,
        ...options
      };

      const response = await axios.post(`${this.apiUrl}/sendMessage`, payload);
      return response.data;
    } catch (error) {
      console.error('Erro ao enviar mensagem com botões no Telegram:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Enviar documento
   */
  async sendDocument(chatId, document, caption = '', options = {}) {
    try {
      const formData = new FormData();
      formData.append('chat_id', chatId);
      formData.append('document', document);
      if (caption) formData.append('caption', caption);
      formData.append('parse_mode', 'HTML');

      const response = await axios.post(`${this.apiUrl}/sendDocument`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        ...options
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao enviar documento no Telegram:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Responder callback query
   */
  async answerCallbackQuery(callbackQueryId, text = '', showAlert = false) {
    try {
      const payload = {
        callback_query_id: callbackQueryId,
        text: text,
        show_alert: showAlert
      };

      const response = await axios.post(`${this.apiUrl}/answerCallbackQuery`, payload);
      return response.data;
    } catch (error) {
      console.error('Erro ao responder callback query:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Obter informações do bot
   */
  async getMe() {
    try {
      const response = await axios.get(`${this.apiUrl}/getMe`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter informações do bot:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Configurar webhook
   */
  async setWebhook(webhookUrl, options = {}) {
    try {
      const payload = {
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query'],
        ...options
      };

      const response = await axios.post(`${this.apiUrl}/setWebhook`, payload);
      return response.data;
    } catch (error) {
      console.error('Erro ao configurar webhook:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Obter informações do webhook
   */
  async getWebhookInfo() {
    try {
      const response = await axios.get(`${this.apiUrl}/getWebhookInfo`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter informações do webhook:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Deletar webhook
   */
  async deleteWebhook() {
    try {
      const response = await axios.post(`${this.apiUrl}/deleteWebhook`);
      return response.data;
    } catch (error) {
      console.error('Erro ao deletar webhook:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Enviar mensagem de boas-vindas
   */
  async sendWelcomeMessage(chatId, userName, tenantName) {
    const welcomeText = `
🎉 <b>Bem-vindo ao ${tenantName}!</b>

Olá, ${userName}! 👋

Sou o assistente virtual da sua empresa e estou aqui para ajudá-lo com:

📋 <b>Informações importantes</b>
📚 <b>Documentos e políticas</b>
❓ <b>Dúvidas frequentes</b>
🔧 <b>Suporte técnico</b>

Digite <code>/help</code> para ver todos os comandos disponíveis ou simplesmente me faça uma pergunta!

Estou aqui para ajudar! 😊
    `.trim();

    const buttons = [
      [
        { text: '📋 Ver Documentos', callback_data: 'view_documents' },
        { text: '❓ FAQ', callback_data: 'faq' }
      ],
      [
        { text: '🔧 Suporte', callback_data: 'support' },
        { text: 'ℹ️ Informações', callback_data: 'info' }
      ]
    ];

    return await this.sendMessageWithButtons(chatId, welcomeText, buttons);
  }

  /**
   * Enviar menu principal
   */
  async sendMainMenu(chatId) {
    const menuText = `
🤖 <b>Menu Principal</b>

Escolha uma das opções abaixo:

    `.trim();

    const buttons = [
      [
        { text: '📋 Documentos', callback_data: 'documents' },
        { text: '👥 Funcionários', callback_data: 'employees' }
      ],
      [
        { text: '❓ FAQ', callback_data: 'faq' },
        { text: '🔧 Suporte', callback_data: 'support' }
      ],
      [
        { text: 'ℹ️ Sobre', callback_data: 'about' }
      ]
    ];

    return await this.sendMessageWithButtons(chatId, menuText, buttons);
  }
}

module.exports = TelegramBot;
