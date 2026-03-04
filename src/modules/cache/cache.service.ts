import { Inject, Injectable } from '@nestjs/common';
import { Cacheable } from 'cacheable';

@Injectable()
export class CacheService {
  constructor(@Inject('CACHE_INSTANCE') private readonly cache: Cacheable) {}

  async onModuleInit() {
    console.log('Redis initialized');
    // Simulate async initialization logic
  }

  async get(key: string): Promise<any> {
    return await this.cache.get(key);
  }

  async set(key: string, value: any, ttl?: number | string): Promise<void> {
    await this.cache.set(key, value, ttl);
  }

  async delete(key: string): Promise<void> {
    await this.cache.delete(key);
  }
}
