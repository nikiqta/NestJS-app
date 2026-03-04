import { Module } from '@nestjs/common';
import { Cacheable } from 'cacheable';
import { createKeyv } from '@keyv/redis';

@Module({
  providers: [
    {
      provide: 'CACHE_INSTANCE',
      useFactory: () => {
        // If no namespace is set, the default is 'keyv', and keys are prefixed with 'keyv:'.
        const secondary = createKeyv('redis://user:pass@localhost:6379', {
          namespace: 'keyv',
        });
        return new Cacheable({ secondary, ttl: '4h' });
      },
    },
  ],
  exports: ['CACHE_INSTANCE'],
})
export class CacheModule {}
