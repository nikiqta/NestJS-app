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
    try {
      // Add short timeout to prevent hanging (1 second)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Cache get timeout')), 1000)
      );

      const cachePromise = this.cache.get(key);

      const result = await Promise.race([cachePromise, timeoutPromise]);

      return result;
    } catch (error) {
      // Silently return null on error to allow request to proceed
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number | string): Promise<void> {
    try {
      // Add short timeout (1 second)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Cache set timeout')), 1000)
      );

      const cachePromise = this.cache.set(key, value, ttl);

      await Promise.race([cachePromise, timeoutPromise]);
    } catch (error) {
      // Silently fail - cache failures shouldn't break the application
    }
  }

  async delete(key: string): Promise<void> {
    await this.cache.delete(key);
  }

  async deletePattern(pattern: string): Promise<void> {
    try {
      // Get the secondary store (Redis Keyv instance)
      const store = this.cache.secondary as any;

      if (!store || !store.opts || !store.opts.store) {
        console.warn('Cannot access Redis store for pattern deletion');
        return;
      }

      // Access the Redis client from Keyv
      const redis = store.opts.store as any;

      // Use Redis SCAN to find keys matching pattern
      const namespace = store.opts.namespace || 'keyv';
      const fullPattern = `${namespace}:${pattern}`;

      let cursor = '0';
      let keysToDelete: string[] = [];

      do {
        const result = await redis.scan(
          cursor,
          'MATCH',
          fullPattern,
          'COUNT',
          100,
        );
        cursor = result[0];
        const keys = result[1];

        if (keys.length > 0) {
          keysToDelete = keysToDelete.concat(keys);
        }
      } while (cursor !== '0');

      // Delete all matched keys
      if (keysToDelete.length > 0) {
        // Remove namespace prefix before deleting through Cacheable
        const keysWithoutNamespace = keysToDelete.map((key) =>
          key.replace(new RegExp(`^${namespace}:`), ''),
        );

        await Promise.all(
          keysWithoutNamespace.map((key) => this.cache.delete(key)),
        );

        console.log(
          `Deleted ${keysToDelete.length} keys matching pattern: ${pattern}`,
        );
      }
    } catch (error) {
      console.error(`Error deleting pattern ${pattern}:`, error);
      // Don't throw - cache failures shouldn't break the application
    }
  }

  async clear(): Promise<void> {
    try {
      await this.cache.clear();
      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Error clearing cache:', error);
      // Don't throw - cache failures shouldn't break the application
    }
  }
}
