console.log('🚀 Starting debug test...');

try {
  console.log('1. Loading dotenv...');
  require('dotenv').config();
  console.log('✅ dotenv loaded');

  console.log('2. Loading express...');
  const express = require('express');
  console.log('✅ express loaded');

  console.log('3. Loading pino...');
  const pino = require('pino');
  console.log('✅ pino loaded');

  console.log('4. Loading Redis service...');
  const RedisService = require('./src/services/redis');
  console.log('✅ Redis service loaded');

  console.log('5. Creating app...');
  const app = express();
  console.log('✅ app created');

  console.log('6. Setting up basic route...');
  app.get('/test', (req, res) => {
    res.json({ message: 'Test OK', timestamp: new Date().toISOString() });
  });
  console.log('✅ route set up');

  console.log('7. Starting server...');
  app.listen(8080, () => {
    console.log('✅ Server running on port 8080');
    console.log('🔗 Test: http://localhost:8080/test');
  });

} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Stack:', error.stack);
}
