import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cacheable } from 'cacheable';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject('CACHE_INSTANCE') private readonly cache: Cacheable) {}

  async get(key: string): Promise<any> {
    try {
      // Add short timeout to prevent hanging (1 second)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Cache get timeout')), 1000),
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
        setTimeout(() => reject(new Error('Cache set timeout')), 1000),
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

      // Check if scan method exists
      if (!redis.scan || typeof redis.scan !== 'function') {
        console.warn(
          `Redis client does not support scan operation for pattern: ${pattern}. Using clear() as fallback.`,
        );
        // Fallback: just skip pattern deletion
        // You could also call this.cache.clear() to clear everything, but that's too aggressive
        return;
      }

      // Use Redis SCAN to find keys matching pattern
      const namespace = store.opts.namespace || 'keyv';
      const fullPattern = `${namespace}:${pattern}`;

      let cursor = '0';
      let keysToDelete: string[] = [];

      do {
        // Handle both ioredis and node-redis scan signatures
        let result: any;
        try {
          // Try ioredis style (returns array)
          result = await redis.scan(cursor, 'MATCH', fullPattern, 'COUNT', 100);
        } catch (err) {
          // Try node-redis v4 style (different signature)
          result = await redis.scan(cursor, {
            MATCH: fullPattern,
            COUNT: 100,
          });
        }

        // Handle different response formats
        if (Array.isArray(result)) {
          cursor = result[0];
          const keys = result[1] || [];
          if (keys.length > 0) {
            keysToDelete = keysToDelete.concat(keys);
          }
        } else if (result && result.cursor !== undefined) {
          // node-redis v4 format
          cursor = result.cursor.toString();
          const keys = result.keys || [];
          if (keys.length > 0) {
            keysToDelete = keysToDelete.concat(keys);
          }
        } else {
          break;
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

        this.logger.log(
          `Deleted ${keysToDelete.length} keys matching pattern: ${pattern}`,
        );
      }
    } catch (error) {
      this.logger.error(`Error deleting pattern ${pattern}:`, error);
      // Don't throw - cache failures shouldn't break the application
    }
  }

  async clear(): Promise<void> {
    try {
      await this.cache.clear();
      this.logger.log('Cache cleared successfully');
    } catch (error) {
      console.error('Error clearing cache:', error);
      // Don't throw - cache failures shouldn't break the application
    }
  }
}
