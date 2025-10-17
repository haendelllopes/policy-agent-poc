#!/usr/bin/env node

/**
 * 🚀 WhatsApp Simples para Navigator
 * 
 * Alternativa mais simples que a Evolution API
 * Usa Baileys diretamente para evitar problemas de build
 * 
 * Data: 17 de outubro de 2025
 */

const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const qrcode = require('qrcode-terminal');

class NavigatorWhatsApp {
    constructor() {
        this.sock = null;
        this.isConnected = false;
        this.webhookUrl = 'https://hndll.app.n8n.cloud/webhook/evolution-webhook';
    }

    async connect() {
        console.log('🚀 Conectando WhatsApp para Navigator...');

        const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');

        this.sock = makeWASocket({
            auth: state,
            printQRInTerminal: true,
            logger: console,
        });

        this.sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                console.log('📱 QR Code gerado! Escaneie com seu WhatsApp.');
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log('🔄 Conexão fechada devido a ', lastDisconnect?.error, ', reconectando ', shouldReconnect);
                
                if (shouldReconnect) {
                    this.connect();
                }
            } else if (connection === 'open') {
                console.log('✅ WhatsApp conectado com sucesso!');
                this.isConnected = true;
                this.setupMessageHandlers();
            }
        });

        this.sock.ev.on('creds.update', saveCreds);
    }

    setupMessageHandlers() {
        this.sock.ev.on('messages.upsert', async (m) => {
            const msg = m.messages[0];
            if (!msg.message) return;

            console.log('📨 Mensagem recebida:', msg.message);
            
            // Enviar para webhook N8N
            await this.sendToWebhook({
                type: 'message_received',
                from: msg.key.remoteJid,
                text: msg.message.conversation || msg.message.extendedTextMessage?.text || '',
                timestamp: msg.messageTimestamp,
                messageId: msg.key.id
            });
        });
    }

    async sendMessage(to, text) {
        if (!this.isConnected) {
            throw new Error('WhatsApp não está conectado');
        }

        try {
            const sent = await this.sock.sendMessage(to, { text });
            console.log('✅ Mensagem enviada:', sent.key.id);
            return sent;
        } catch (error) {
            console.error('❌ Erro ao enviar mensagem:', error);
            throw error;
        }
    }

    async sendToWebhook(data) {
        try {
            const fetch = (await import('node-fetch')).default;
            
            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                console.log('✅ Webhook enviado com sucesso');
            } else {
                console.error('❌ Erro no webhook:', response.status);
            }
        } catch (error) {
            console.error('❌ Erro ao enviar webhook:', error);
        }
    }

    async testMessage(phone) {
        const message = `🚀 Navigator WhatsApp conectado!\n\nEsta é uma mensagem de teste. Se você recebeu, está tudo funcionando! 🎉\n\nHorário: ${new Date().toLocaleString()}`;
        
        await this.sendMessage(phone + '@s.whatsapp.net', message);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const whatsapp = new NavigatorWhatsApp();
    
    console.log('🚀 Iniciando WhatsApp Navigator...');
    console.log('📋 Instruções:');
    console.log('1. Escaneie o QR Code que aparecerá');
    console.log('2. Aguarde a conexão');
    console.log('3. Digite um número para teste');
    console.log('');
    
    whatsapp.connect().catch(console.error);
    
    // Aguardar conexão e testar
    setTimeout(async () => {
        if (whatsapp.isConnected) {
            console.log('📱 Digite um número de telefone para teste (ex: 556299940476):');
            
            process.stdin.once('data', async (data) => {
                const phone = data.toString().trim();
                if (phone) {
                    await whatsapp.testMessage(phone);
                }
            });
        }
    }, 30000); // Aguardar 30 segundos
}

module.exports = NavigatorWhatsApp;
