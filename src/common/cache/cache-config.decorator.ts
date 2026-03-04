import { SetMetadata } from '@nestjs/common';

export interface CacheConfigOptions {
  ttl?: string | number;
  userSpecific?: boolean;
}

export const CACHE_CONFIG_KEY = 'cache-config';

export const CacheConfig = (config: CacheConfigOptions) =>
  SetMetadata(CACHE_CONFIG_KEY, config);
