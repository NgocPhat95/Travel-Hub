import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  onModuleInit() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.client = new Redis(redisUrl);
    console.log('Redis connected successfully.');
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
    }
  }

  getClient(): Redis {
    return this.client;
  }

  async getSearchHistory(userId: string): Promise<string[]> {
    const key = `user:search_history:${userId}`;
    return this.client.lrange(key, 0, 4); // Get top 5 recent search terms
  }

  async addSearchHistory(userId: string, term: string): Promise<void> {
    const key = `user:search_history:${userId}`;
    const trimmed = term.trim();
    if (!trimmed) {
      return;
    }

    // Remove duplicate term if already exists in the list
    await this.client.lrem(key, 0, trimmed);
    // Push new term to the head of the list
    await this.client.lpush(key, trimmed);
    // Limit the list to top 5 items
    await this.client.ltrim(key, 0, 4);
  }

  async clearSearchHistory(userId: string): Promise<void> {
    const key = `user:search_history:${userId}`;
    await this.client.del(key);
  }
}
