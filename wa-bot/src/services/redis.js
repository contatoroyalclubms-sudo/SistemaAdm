const { createClient } = require('redis');

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis Client Connected');
        this.isConnected = true;
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  async set(key, value, expireInSeconds = null) {
    if (!this.isConnected) throw new Error('Redis not connected');
    
    const serializedValue = JSON.stringify(value);
    if (expireInSeconds) {
      return await this.client.setEx(key, expireInSeconds, serializedValue);
    }
    return await this.client.set(key, serializedValue);
  }

  async get(key) {
    if (!this.isConnected) throw new Error('Redis not connected');
    
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async del(key) {
    if (!this.isConnected) throw new Error('Redis not connected');
    return await this.client.del(key);
  }

  async exists(key) {
    if (!this.isConnected) throw new Error('Redis not connected');
    return await this.client.exists(key);
  }

  async incr(key) {
    if (!this.isConnected) throw new Error('Redis not connected');
    return await this.client.incr(key);
  }

  async expire(key, seconds) {
    if (!this.isConnected) throw new Error('Redis not connected');
    return await this.client.expire(key, seconds);
  }
}

module.exports = RedisService;
