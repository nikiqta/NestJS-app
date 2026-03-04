import { Module, OnModuleDestroy } from '@nestjs/common';
import { Cacheable } from 'cacheable';
import { createKeyv } from '@keyv/redis';
import { CacheService } from './cache.service';

let cacheInstance: Cacheable | null = null;

@Module({
  providers: [
    {
      provide: 'CACHE_INSTANCE',
      useFactory: async () => {
        // Reuse existing instance if available (helps with hot reload)
        if (cacheInstance) {
          console.log('[CacheModule] Reusing existing cache instance');
          return cacheInstance;
        }

        try {
          console.log('[CacheModule] Initializing Redis connection...');

          const secondary = createKeyv('redis://127.0.0.1:6380', {
            namespace: 'keyv',
          });

          // Set up event handlers BEFORE any operations
          if (secondary.opts?.store) {
            const redis = secondary.opts.store as any;

            redis.on?.('error', (err: any) => {
              console.error('[CacheModule] Redis error:', err.message);
            });

            redis.on?.('connect', () => {
              console.log('[CacheModule] Redis connected successfully');
            });

            redis.on?.('ready', () => {
              console.log('[CacheModule] Redis ready for operations');
            });

            redis.on?.('reconnecting', () => {
              console.log('[CacheModule] Redis reconnecting...');
            });

            // Wait for connection to be established
            if (redis.connect && typeof redis.connect === 'function') {
              await redis.connect();
              console.log('[CacheModule] Redis connection established');
            }
          }

          const cacheable = new Cacheable({ secondary, ttl: '4h' });
          cacheInstance = cacheable;
          console.log('[CacheModule] Cacheable instance created');

          return cacheable;
        } catch (error) {
          console.error('[CacheModule] Error creating cache instance:', error);
          // Return a dummy cache that does nothing
          const fallback = new Cacheable({ ttl: '4h' });
          cacheInstance = fallback;
          return fallback;
        }
      },
    },
    CacheService,
  ],
  exports: ['CACHE_INSTANCE', CacheService],
})
export class CacheModule implements OnModuleDestroy {
  async onModuleDestroy() {
    console.log('[CacheModule] Cleaning up Redis connection...');
    if (cacheInstance?.secondary) {
      try {
        const redis = (cacheInstance.secondary as any).opts?.store;
        if (redis?.quit && typeof redis.quit === 'function') {
          await redis.quit();
          console.log('[CacheModule] Redis connection closed');
        }
      } catch (error) {
        console.error('[CacheModule] Error closing Redis connection:', error);
      }
    }
    cacheInstance = null;
  }
}
