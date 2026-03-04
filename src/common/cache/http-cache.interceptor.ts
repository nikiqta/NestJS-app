import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of, from } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import { CacheService } from '../../modules/cache/cache.service';
import { CACHE_CONFIG_KEY, CacheConfigOptions } from './cache-config.decorator';

@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HttpCacheInterceptor.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Only cache GET requests
    if (method !== 'GET') {
      return next.handle();
    }

    // Get cache configuration from decorator metadata
    const cacheConfig = this.reflector.get<CacheConfigOptions>(
      CACHE_CONFIG_KEY,
      context.getHandler(),
    );

    // Generate cache key
    const cacheKey = this.generateCacheKey(request, cacheConfig);

    // Convert the async cache.get() into an Observable and handle the result
    return from(this.cacheService.get(cacheKey)).pipe(
      switchMap((cachedResponse) => {
        // If cached response exists, return it
        if (cachedResponse !== undefined && cachedResponse !== null) {
          this.logger.log(`Cache HIT for ${cacheKey}`);
          return of(cachedResponse);
        }

        // Cache miss - execute handler and cache the response
        this.logger.log(`Cache MISS for ${cacheKey}`);

        return next.handle().pipe(
          tap(async (response) => {
            try {
              // Determine TTL from config or use default
              const ttl = cacheConfig?.ttl;

              await this.cacheService.set(cacheKey, response, ttl);
              this.logger.debug(
                `Cached response for ${cacheKey} with TTL: ${ttl || 'default (4h)'}`,
              );
            } catch (error) {
              this.logger.error(`Error caching response for ${cacheKey}:`, error);
            }
          }),
        );
      }),
    );
  }

  private generateCacheKey(
    request: any,
    cacheConfig?: CacheConfigOptions,
  ): string {
    const url = request.url;
    const path = request.route?.path || url.split('?')[0];
    const params = request.params;
    const query = request.query;
    const user = request.user;

    // Check if endpoint is user-specific
    const isUserSpecific =
      cacheConfig?.userSpecific ||
      path.includes('/userEvents') ||
      path.includes('/userTickets');

    // Build cache key parts
    let keyParts: string[] = ['cache'];

    // Add user context for user-specific endpoints
    if (isUserSpecific && user?.userId) {
      keyParts.push('user', user.userId);
    }

    // Parse path to extract resource segments
    // Remove leading /api/ and split by /
    const pathSegments = path
      .replace(/^\/api\//, '')
      .split('/')
      .filter(Boolean);

    // Add path segments, replacing params with actual values
    pathSegments.forEach((segment) => {
      if (segment.startsWith(':')) {
        // This is a parameter placeholder, use actual value
        const paramName = segment.slice(1);
        const paramValue = params[paramName];
        if (paramValue) {
          keyParts.push(paramValue);
        }
      } else {
        keyParts.push(segment);
      }
    });

    // Add query parameters if present
    if (query && Object.keys(query).length > 0) {
      const queryString = Object.keys(query)
        .sort()
        .map((key) => `${key}=${query[key]}`)
        .join('&');
      keyParts.push(`?${queryString}`);
    }

    return keyParts.join(':');
  }
}
