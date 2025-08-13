const { createClient } = require('redis');

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.fallbackMode = false;
    this.memoryStorage = new Map();
  }

  async connect() {
    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: { reconnectStrategy: false }
      });

      this.client.on('error', async (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
        await this.enableFallbackMode();
      });

      this.client.on('connect', () => {
        console.log('Redis Client Connected');
        this.isConnected = true;
        this.fallbackMode = false;
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      console.error('Failed to connect to Redis, using fallback mode:', error.message);
      await this.enableFallbackMode();
      return null;
    }
  }

  async enableFallbackMode() {
    if (this.fallbackMode) return;
    this.fallbackMode = true;
    console.log('⚠️  Redis não disponível - usando armazenamento em memória local');
    try {
      if (this.client) {
        await this.client.disconnect().catch(() => {});
      }
    } catch (_) {}
    this.client = null;
  }

  async disconnect() {
    if (this.client && this.isConnected && !this.fallbackMode) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  async set(key, value, expireInSeconds = null) {
    if (this.fallbackMode) {
      const item = {
        value: value,
        timestamp: Date.now(),
        expireAt: expireInSeconds ? Date.now() + (expireInSeconds * 1000) : null
      };
      this.memoryStorage.set(key, item);
      return 'OK';
    }
    
    if (!this.isConnected) throw new Error('Redis not connected');
    
    const serializedValue = JSON.stringify(value);
    if (expireInSeconds) {
      return await this.client.setEx(key, expireInSeconds, serializedValue);
    }
    return await this.client.set(key, serializedValue);
  }

  async get(key) {
    if (this.fallbackMode) {
      const item = this.memoryStorage.get(key);
      if (!item) return null;
      if (item.expireAt && Date.now() > item.expireAt) {
        this.memoryStorage.delete(key);
        return null;
      }
      return item.value;
    }
    if (!this.isConnected) throw new Error('Redis not connected');
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async del(key) {
    if (this.fallbackMode) {
      return this.memoryStorage.delete(key) ? 1 : 0;
    }
    if (!this.isConnected) throw new Error('Redis not connected');
    return await this.client.del(key);
  }

  async exists(key) {
    if (this.fallbackMode) {
      const item = this.memoryStorage.get(key);
      if (!item) return 0;
      if (item.expireAt && Date.now() > item.expireAt) {
        this.memoryStorage.delete(key);
        return 0;
      }
      return 1;
    }
    if (!this.isConnected) throw new Error('Redis not connected');
    return await this.client.exists(key);
  }

  async keys(pattern) {
    if (this.fallbackMode) {
      // Convert simple Redis pattern with * to RegExp
      const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
      const regex = new RegExp(`^${escaped}$`);
      const results = [];
      for (const key of this.memoryStorage.keys()) {
        if (regex.test(key)) {
          results.push(key);
        }
      }
      return results;
    }
    if (!this.isConnected) throw new Error('Redis not connected');
    return await this.client.keys(pattern);
  }

  async incr(key) {
    if (this.fallbackMode) {
      const currentValue = await this.get(key) || 0;
      const newValue = parseInt(currentValue) + 1;
      await this.set(key, newValue);
      return newValue;
    }
    if (!this.isConnected) throw new Error('Redis not connected');
    return await this.client.incr(key);
  }

  async expire(key, seconds) {
    if (this.fallbackMode) {
      const item = this.memoryStorage.get(key);
      if (item) {
        item.expireAt = Date.now() + (seconds * 1000);
        return 1;
      }
      return 0;
    }
    if (!this.isConnected) throw new Error('Redis not connected');
    return await this.client.expire(key, seconds);
  }

  cleanupExpired() {
    if (this.fallbackMode) {
      const now = Date.now();
      for (const [key, item] of this.memoryStorage.entries()) {
        if (item.expireAt && now > item.expireAt) {
          this.memoryStorage.delete(key);
        }
      }
    }
  }

  startCleanupInterval() {
    if (this.fallbackMode) {
      setInterval(() => {
        this.cleanupExpired();
      }, 5 * 60 * 1000);
    }
  }
}

module.exports = RedisService;
