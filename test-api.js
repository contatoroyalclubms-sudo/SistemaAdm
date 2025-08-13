require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '🎭 Royal Club WhatsApp Bot API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// WhatsApp status (mock)
app.get('/api/whatsapp/status', (req, res) => {
  res.json({
    success: true,
    data: {
      connected: false,
      status: 'initializing',
      message: 'WhatsApp service starting...'
    }
  });
});

// QR Code endpoint (mock)
app.get('/api/whatsapp/qr', (req, res) => {
  const qrHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Royal Club - WhatsApp QR Code</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          text-align: center;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          min-height: 100vh;
          margin: 0;
        }
        .container {
          max-width: 500px;
          margin: 0 auto;
          background: rgba(255,255,255,0.1);
          padding: 30px;
          border-radius: 15px;
          backdrop-filter: blur(10px);
        }
        h1 { color: #FFD700; margin-bottom: 10px; }
        .status { 
          background: #28a745;
          color: white;
          padding: 15px;
          border-radius: 10px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎭 ROYAL CLUB</h1>
        <p>WhatsApp Bot - MC Daniel Falcão</p>
        
        <div class="status">
          ✅ API está funcionando!<br>
          🔧 Sistema configurado com sucesso<br>
          📱 WhatsApp em configuração...
        </div>
        
        <p><strong>🚀 Bot está pronto para funcionar!</strong></p>
        <p>Próximo passo: Configurar WhatsApp Web</p>
        
        <div style="margin-top: 30px; font-size: 14px; opacity: 0.8;">
          <p>✅ Servidor rodando na porta ${port}</p>
          <p>✅ API endpoints ativos</p>
          <p>✅ Configurações carregadas</p>
        </div>
      </div>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.send(qrHtml);
});

// API documentation
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'Royal Club WhatsApp Automation API',
    version: '1.0.0',
    description: 'API para automação de vendas via WhatsApp',
    status: 'FUNCIONANDO ✅',
    endpoints: {
      'GET /health': 'Status do sistema',
      'GET /api/whatsapp/status': 'Status da conexão WhatsApp',
      'GET /api/whatsapp/qr': 'QR Code para conectar WhatsApp',
      'GET /api/docs': 'Esta documentação'
    },
    nextSteps: [
      '1. Configurar WhatsApp Web',
      '2. Testar envio de mensagens',
      '3. Ativar funil de vendas'
    ]
  });
});

// Start server
app.listen(port, () => {
  console.log(`\n🎭 ======================================`);
  console.log(`   ROYAL CLUB - WHATSAPP BOT API`);
  console.log(`======================================`);
  console.log(`🚀 Servidor: http://localhost:${port}`);
  console.log(`📱 WhatsApp: http://localhost:${port}/api/whatsapp/qr`);
  console.log(`📊 API Docs: http://localhost:${port}/api/docs`);
  console.log(`❤️  Health: http://localhost:${port}/health`);
  console.log(`======================================`);
  console.log(`✅ Sistema FUNCIONANDO!`);
  console.log(`⏰ ${new Date().toLocaleString('pt-BR')}`);
  console.log(`======================================\n`);
});

module.exports = app;
