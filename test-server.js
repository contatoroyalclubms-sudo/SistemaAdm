const express = require('express');
const app = express();
const port = 8080;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Royal Club Bot - Health Check OK'
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Royal Club WhatsApp Bot',
    version: '1.0.0',
    status: 'running'
  });
});

app.listen(port, () => {
  console.log(`🚀 Test server running on port ${port}`);
  console.log(`📱 Health check: http://localhost:${port}/health`);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down test server...');
  process.exit(0);
});
