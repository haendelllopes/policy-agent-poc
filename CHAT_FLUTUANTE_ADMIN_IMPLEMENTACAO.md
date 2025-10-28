# 🔔 Chat Flutuante Admin - Implementação de Detecção e Notificação Proativa

**Data:** 12 de janeiro de 2025  
**Status:** 🚧 Em Planejamento  
**Prioridade:** ALTA

---

## 📋 **CONTEXTO**

O Navigator possui um sistema completo de detecção de urgências que **já funciona no backend e N8N**, mas falta a **interface visual** para os admins serem notificados em tempo real.

### **O QUE JÁ EXISTE** ✅

- ✅ Backend: `/api/agente/alertas/urgencia-critica`
- ✅ N8N: Workflow de detecção de urgência configurado
- ✅ Banco de Dados: Notificações sendo salvas
- ✅ Logs: Sistema de emergência funcionando
- ❌ **Frontend: Interface de notificação em tempo real**

---

## 🎯 **OBJETIVO**

Implementar um **chat flutuante** que apareça automaticamente quando uma urgência crítica for detectada, permitindo que o admin:

1. **Veja o alerta em tempo real** (popup/floating)
2. **Visualize detalhes** do colaborador e problema
3. **Tome ações rápidas** (responder, escalar, criar ticket)
4. **Acompanhe histórico** de alertas

---

## 🏗️ **ARQUITETURA PROPOSTA**

### **Fluxo Completo:**

```
1. Colaborador envia mensagem: "estou a dois dias sem conseguir acessar a plataforma"
   ↓
2. N8N analisa: urgencia = "critica", categoria = "tecnico"
   ↓
3. Backend: POST /api/agente/alertas/urgencia-critica
   ↓
4. Sistema busca admins e salva notificação
   ↓
5. [NOVO] WebSocket envia evento para frontend admin
   ↓
6. [NOVO] Chat flutuante aparece com alerta
   ↓
7. Admin pode responder/agir
```

---

## 🛠️ **IMPLEMENTAÇÃO - 3 ETAPAS**

### **ETAPA 1: WebSocket Server** (2h)

Criar endpoint WebSocket para notificações em tempo real.

**Arquivo:** `src/server.js` ou `src/websocket-server.js`

```javascript
// src/websocket-server.js
import { Server } from 'socket.io';
import { createServer } from 'http';
import express from 'express';

const app = express();
const http = createServer(app);
const io = new Server(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Armazenar conexões por tenant
const adminConnections = new Map();

io.on('connection', (socket) => {
  console.log('👤 Admin conectado:', socket.id);

  // Admin envia tenant_id ao conectar
  socket.on('admin:connect', (data) => {
    const { tenantId, adminId } = data;
    
    if (!adminConnections.has(tenantId)) {
      adminConnections.set(tenantId, []);
    }
    
    adminConnections.get(tenantId).push({
      socketId: socket.id,
      adminId: adminId,
      connectedAt: new Date()
    });
    
    console.log(`📊 Admin ${adminId} conectado ao tenant ${tenantId}`);
  });

  socket.on('disconnect', () => {
    // Remover da lista de conexões
    adminConnections.forEach((connections, tenantId) => {
      const index = connections.findIndex(c => c.socketId === socket.id);
      if (index !== -1) {
        connections.splice(index, 1);
      }
    });
  });
});

// Função para notificar admins de um tenant
export function notifyAdmins(tenantId, notification) {
  const connections = adminConnections.get(tenantId);
  
  if (!connections || connections.length === 0) {
    console.log(`⚠️ Nenhum admin online para tenant ${tenantId}`);
    return;
  }

  connections.forEach(({ socketId }) => {
    io.to(socketId).emit('admin:alert', notification);
    console.log(`📨 Notificação enviada para admin ${socketId}`);
  });
}

export { http, io };
```

---

### **ETAPA 2: Integrar com Endpoint de Urgência** (1h)

Modificar o endpoint existente para enviar notificação via WebSocket.

**Arquivo:** `src/routes/agente-anotacoes.js`

```javascript
import { notifyAdmins } from '../websocket-server.js';

router.post('/alertas/urgencia-critica', authenticate, async (req, res) => {
  try {
    // ... código existente ...

    // 3. Log de emergência
    console.log('🚨 LOG EMERGÊNCIA:', {
      timestamp: new Date().toISOString(),
      tenant_id: req.tenantId,
      anotacao_id,
      categoria,
      mensagem,
      admins_notificados: admins.rows.length,
      acao_sugerida
    });

    // 🆕 4. NOTIFICAR ADMINS VIA WEBSOCKET
    notifyAdmins(req.tenantId, {
      tipo: 'urgencia_critica',
      titulo: `🚨 URGÊNCIA CRÍTICA - ${categoria}`,
      mensagem: mensagem,
      colaborador_id: colaborador_id,
      colaborador_nome: 'Nome do Colaborador', // Buscar do banco se necessário
      categoria: categoria,
      acao_sugerida: acao_sugerida,
      timestamp: new Date().toISOString(),
      anotacao_id: anotacao_id,
      link_detalhes: `/admin/anotacoes/${anotacao_id}`
    });

    res.json({
      success: true,
      notified: admins.rows.length,
      admins: admins.rows.map(a => ({ id: a.id, name: a.name })),
      message: 'Admins notificados com sucesso',
      alerta_id: `urg-${Date.now()}-${anotacao_id}`
    });

  } catch (error) {
    console.error('Erro ao processar alerta de urgência:', error);
    res.status(500).json({
      error: 'Erro ao processar alerta',
      details: error.message
    });
  }
});
```

---

### **ETAPA 3: Frontend - Chat Flutuante** (3h)

Criar componente React para exibir notificações em tempo real.

**Arquivo:** `public/admin-floating-chat.html` (ou componente React)

#### **3.1. HTML Principal:**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin - Navigator</title>
    <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
    <style>
        /* [ESTILOS] - Ver seção 3.2 */
    </style>
</head>
<body>
    <!-- [CONTENT] -->
    <div id="floating-alert"></div>
    
    <script>
        // [JAVASCRIPT] - Ver seção 3.3
    </script>
</body>
</html>
```

#### **3.2. Estilos CSS:**

```css
/* Chat Flutuante de Alerta */
#floating-alert {
    position: fixed;
    bottom: 20px;
    right: 20px;
    max-width: 400px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    z-index: 9999;
    display: none;
    animation: slideIn 0.3s ease;
    font-family: 'Roboto', sans-serif;
}

#floating-alert.show {
    display: block;
}

#floating-alert.critica {
    border-left: 4px solid #EF4444;
}

#floating-alert.alta {
    border-left: 4px solid #F59E0B;
}

@keyframes slideIn {
    from {
        transform: translateX(400px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.alert-header {
    padding: 16px;
    background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
    color: white;
    border-radius: 12px 12px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.alert-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
}

.alert-close {
    background: rgba(255,255,255,0.2);
    border: none;
    color: white;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.alert-close:hover {
    background: rgba(255,255,255,0.3);
}

.alert-body {
    padding: 16px;
}

.alert-content {
    margin-bottom: 12px;
}

.alert-content p {
    margin: 0 0 8px 0;
    color: #374151;
    line-height: 1.5;
}

.alert-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
}

.alert-tag {
    background: #EEF2FF;
    color: #4F46E5;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
}

.alert-actions {
    display: flex;
    gap: 8px;
    margin-top: 16px;
}

.btn {
    flex: 1;
    padding: 10px 16px;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-primary {
    background: #4F46E5;
    color: white;
}

.btn-primary:hover {
    background: #4338CA;
}

.btn-secondary {
    background: #F3F4F6;
    color: #374151;
}

.btn-secondary:hover {
    background: #E5E7EB;
}
```

#### **3.3. JavaScript:**

```javascript
// Configuração
const TENANT_ID = '5978f911-738b-4aae-802a-f037fdac2e64'; // Pegar do contexto
const ADMIN_ID = 'admin-uuid'; // Pegar do auth
const WEBSOCKET_URL = 'http://localhost:3000'; // ou URL de produção

// Conectar WebSocket
const socket = io(WEBSOCKET_URL);

socket.on('connect', () => {
    console.log('✅ Conectado ao servidor de notificações');
    
    // Registrar admin online
    socket.emit('admin:connect', {
        tenantId: TENANT_ID,
        adminId: ADMIN_ID
    });
});

// Escutar alertas
socket.on('admin:alert', (notification) => {
    console.log('🚨 Novo alerta recebido:', notification);
    showFloatingAlert(notification);
});

// Função para exibir alerta
function showFloatingAlert(notification) {
    const alertDiv = document.getElementById('floating-alert');
    const priority = notification.tipo === 'urgencia_critica' ? 'critica' : 'alta';
    
    alertDiv.className = priority;
    
    alertDiv.innerHTML = `
        <div class="alert-header">
            <h3>${notification.titulo}</h3>
            <button class="alert-close" onclick="closeAlert()">×</button>
        </div>
        <div class="alert-body">
            <div class="alert-content">
                <p><strong>Colaborador:</strong> ${notification.colaborador_nome}</p>
                <p>${notification.mensagem}</p>
            </div>
            <div class="alert-meta">
                <span class="alert-tag">${notification.categoria}</span>
                <span class="alert-tag">${notification.acao_sugerida}</span>
            </div>
            <div class="alert-actions">
                <button class="btn btn-primary" onclick="viewDetails('${notification.link_detalhes}')">
                    Ver Detalhes
                </button>
                <button class="btn btn-secondary" onclick="closeAlert()">
                    Fechar
                </button>
            </div>
        </div>
    `;
    
    // Mostrar com animação
    alertDiv.classList.add('show');
    
    // Auto-fechar após 30 segundos
    setTimeout(() => {
        if (alertDiv.classList.contains('show')) {
            closeAlert();
        }
    }, 30000);
}

function closeAlert() {
    const alertDiv = document.getElementById('floating-alert');
    alertDiv.classList.remove('show');
}

function viewDetails(link) {
    window.location.href = link;
}

// Feedback visual/sonoro (opcional)
function playAlertSound() {
    // Tocar som de notificação (opcional)
}
```

---

## 🧪 **TESTES**

### **Teste Manual:**

1. **Abrir duas janelas** (uma como colaborador, outra como admin)
2. **Conectar WebSocket** no lado admin
3. **Enviar mensagem crítica** no lado colaborador
4. **Verificar** se o chat flutuante aparece no admin

### **Teste Automatizado:**

```javascript
// test-floatin-chat-admin.js
const io = require('socket.io-client');
const socket = io('http://localhost:3000');

socket.on('connect', () => {
    console.log('✅ Conectado');
    
    socket.emit('admin:connect', {
        tenantId: 'test-tenant',
        adminId: 'test-admin'
    });
    
    // Simular alerta (via backend)
    setTimeout(() => {
        console.log('📤 Simulando alerta...');
        // Chama endpoint de urgência crítica
    }, 2000);
});

socket.on('admin:alert', (notification) => {
    console.log('✅ Alerta recebido:', notification);
    process.exit(0);
});

setTimeout(() => {
    console.log('❌ Timeout - alerta não recebido');
    process.exit(1);
}, 10000);
```

---

## 📊 **MELHORIAS FUTURAS**

### **Fase 2: Histórico de Alertas**
- Mostrar últimos 10 alertas
- Botão "Ver Todos" abre modal

### **Fase 3: Badge de Contagem**
- Mostrar quantidade de alertas não visualizados
- Atualizar em tempo real

### **Fase 4: Ações Rápidas**
- Botão "Responder" abre modal de resposta
- Botão "Escalar" envia para TI/RH

---

## 🎯 **CRITÉRIOS DE SUCESSO**

- ✅ Chat flutuante aparece em < 2 segundos após alerta
- ✅ Notificação persiste até admin fechar
- ✅ Visual claro e profissional
- ✅ Funciona em mobile e desktop
- ✅ Auto-fecha após 30 segundos
- ✅ Link para detalhes funciona

---

## 🚀 **PRÓXIMOS PASSOS**

1. **Implementar WebSocket Server** (2h)
2. **Integrar com endpoint existente** (1h)
3. **Criar componente frontend** (3h)
4. **Testar fluxo completo** (1h)
5. **Deploy em produção** (1h)

**Total estimado:** 8 horas

---

## 📝 **NOTAS IMPORTANTES**

- WebSocket precisa de **HTTPS** em produção (usar WSS)
- Implementar **reconexão automática** se conexão cair
- Considerar **rate limiting** para evitar spam de notificações
- Adicionar **permissões** (apenas admins veem alertas)

---

**🎉 Com isso, o sistema de detecção e notificação proativa estará 100% completo!**
