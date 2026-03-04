# Claude.md - NestJS Insurance BFF API

## Project Overview

This is an **Insurance BFF (Backend for Frontend) API** built with NestJS. It serves as an integration layer between the frontend application and downstream insurance services.

**Tech Stack:**
- NestJS (Node.js framework)
- TypeScript
- MongoDB with Mongoose
- Redis (caching)
- JWT authentication
- Passport.js (local & JWT strategies)
- Swagger/OpenAPI documentation

## Project Structure

```
src/
├── common/              # Shared utilities and middleware
│   ├── cache/          # HTTP cache interceptor & decorators
│   ├── errors/         # Error handling (filters, mappers, codes)
│   ├── http/           # HTTP client configuration
│   ├── log/            # Logging utilities
│   └── logging/        # Request logging middleware & interceptors
├── config/             # Configuration files
│   ├── configuration.ts
│   ├── cron.config.ts
│   ├── jwt.config.ts
│   ├── mongodb.config.ts
│   └── validation.config.ts
├── database/           # Database configuration
├── modules/            # Feature modules
│   ├── auth/          # Authentication (JWT, local strategy)
│   ├── cache/         # Redis cache module & service
│   ├── comment/       # Comment management
│   ├── events/        # Event handling
│   ├── http/          # HTTP module
│   ├── ticket/        # Ticket management
│   └── user/          # User management
├── app.module.ts       # Root module
└── main.ts            # Application entry point
```

## Key Features

### Authentication & Security
- **JWT Authentication**: Bearer token-based with access and refresh tokens
- **Password Security**: bcryptjs for password hashing
- **Auth Guards**: JWT guard, JWT refresh guard, local auth guard
- **Security Headers**: HSTS, CSP, X-Frame-Options, X-Content-Type-Options, etc.
- **CORS**: Configured for specific origins (dev/prod environments)

### Data & Caching
- **MongoDB**: Primary database using Mongoose ODM
- **Redis Caching**: Integrated with `@nestjs/cache-manager` and `@keyv/redis`
- **Validation**: Global validation pipes with class-validator and class-transformer

### Developer Experience
- **Swagger Documentation**: Available at `/docs` endpoint with Bearer auth support
- **Request Logging**: Custom middleware and interceptors for request tracking
- **Error Handling**: Centralized error mapping and API exception filters
- **Environment Configuration**: Joi-based validation for environment variables

### Scheduled Tasks
- **Cron Jobs**: Using `@nestjs/schedule` for background tasks

## Environment Configuration

Environment variables are validated using Joi. Check `.env` file for:
- `APP_ENV`: Environment (dev/prod)
- `PORT`: Application port (default: 3000)
- `CORS_ORIGIN`: Allowed CORS origins
- MongoDB connection details
- JWT secrets
- Redis configuration
- Log levels

## Development Commands

```bash
# Development
npm run start:dev          # Start with hot-reload
npm run start:debug        # Start with debugger

# Production
npm run build             # Build the application
npm run start:prod        # Run production build

# Testing
npm run test              # Run unit tests
npm run test:watch        # Run tests in watch mode
npm run test:cov          # Run tests with coverage
npm run test:e2e          # Run e2e tests

# Code Quality
npm run lint              # Lint and fix
npm run format            # Format code with Prettier
```

## Git Workflow

- **Main Branch**: `main` (for production releases)
- **Development Branch**: `develop` (current working branch)
- Feature branches should be created from `develop`
- PRs should target `develop` unless it's a hotfix

## Architecture Patterns

### Module Structure
Each feature module follows this pattern:
```
module-name/
├── module-name.module.ts      # Module definition
├── module-name.controller.ts  # HTTP endpoints
├── module-name.service.ts     # Business logic
├── dto/                       # Data Transfer Objects
├── guards/                    # Route guards (if needed)
└── strategies/                # Auth strategies (if needed)
```

### Error Handling
- Use custom `ApiException` filter for consistent error responses
- Error codes defined in `common/errors/error.codes.ts`
- Error mapper in `common/errors/error.mapper.ts`

### Validation
- DTOs use class-validator decorators
- Global validation pipe configured with:
  - `transform: true` - Auto-transform payloads
  - `whitelist: true` - Strip unknown properties
  - `forbidNonWhitelisted: true` - Reject unknown properties

## Important Notes

### CORS Configuration
The CORS origin is hardcoded for dev environment (`http://192.168.214.147:8081`). Update in `main.ts` if needed.

### Security Headers
Security headers are set globally in middleware (line 28-40 in `main.ts`). Review and adjust based on security requirements.

### Authentication Flow
1. Login via `/auth/login` with local strategy
2. Receive access token (short-lived) and refresh token (long-lived)
3. Use access token in Authorization header: `Bearer <token>`
4. Refresh access token using `/auth/refresh` endpoint

### Redis Setup & Configuration

**Development Environment:**
- **Redis Server**: Running in Docker on `localhost:6380`
- **RedisInsight**: Management GUI available on `localhost:6379`

**Starting Redis Server:**
```bash
# Start Redis server container (run once)
docker run -d --name redis -p 6380:6379 redis:latest

# Verify Redis is running
docker ps | grep redis
```

**Cache Module Implementation:**
- Located in `src/modules/cache/`
- Uses `cacheable` library with `@keyv/redis` adapter
- Default TTL: 4 hours
- Implements singleton pattern to prevent connection leaks during hot reload
- Lazy connection: Connects on first cache operation, not during initialization

**Important Notes:**
- ⚠️ **Port 6379** is used by RedisInsight (GUI), **NOT the Redis server**
- ✅ **Port 6380** is the actual Redis server for the application
- The cache module implements proper cleanup via `OnModuleDestroy` lifecycle hook
- Instance caching prevents connection leaks during development hot reloads
- Connection errors are gracefully handled with fallback to in-memory cache

**Connection Configuration:**
Current configuration in `cache.module.ts`:
```typescript
const secondary = createKeyv('redis://127.0.0.1:6380', {
  namespace: 'keyv',
});
```

**Future Enhancement:**
Move Redis configuration to environment variables:
```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6380
REDIS_NAMESPACE=keyv
```

### Caching Strategy

Redis caching is available through the cache module using the `CacheService`.

**Using the Cache Service:**
```typescript
import { CacheService } from '../cache/cache.service';

constructor(private readonly cacheService: CacheService) {}

async getData(key: string) {
  // Try to get from cache
  const cached = await this.cacheService.get(key);
  if (cached) return cached;

  // Fetch data and cache it
  const data = await this.fetchData();
  await this.cacheService.set(key, data, '1h'); // Custom TTL
  return data;
}
```

**Cache Service Methods:**
- `get(key: string)`: Retrieve value from cache (with 1s timeout)
- `set(key: string, value: any, ttl?: string)`: Store value in cache
- `delete(key: string)`: Delete specific key
- `deletePattern(pattern: string)`: Delete keys matching pattern (e.g., `'user:*'`)
- `clear()`: Clear entire cache

**HTTP Cache Interceptor:**
Route-level caching is available via `HttpCacheInterceptor` in `src/common/cache/`:
- Automatically caches GET requests
- Generates cache keys from URL, params, query, and user context
- Supports user-specific caching for personalized endpoints
- Configurable TTL per route using `@CacheConfig()` decorator

**Troubleshooting:**
- If you see "Socket closed unexpectedly" errors, verify Redis server is running on correct port
- Check Docker containers: `docker ps | grep redis`
- Restart Redis: `docker restart redis`
- Clear all cache: Use RedisInsight GUI at `http://localhost:6379` or call `cacheService.clear()`

## Recent Changes

See git log for recent commits:
- ✅ **Redis caching implementation** (Docker setup on port 6380)
- ✅ **HTTP Cache Interceptor** for automatic route-level caching
- ✅ Cron jobs implementation
- ✅ Bearer access token authentication
- ✅ CORS logic
- ✅ Ticket & Comment modules
- ✅ Auth & User modules

## Swagger Documentation

Access interactive API documentation at: `http://localhost:3000/docs`

The Swagger UI includes:
- All available endpoints
- Request/response schemas
- Bearer token authentication support
- Try-it-out functionality

## Common Tasks

### Adding a New Module
1. Generate: `nest g module modules/module-name`
2. Generate service: `nest g service modules/module-name`
3. Generate controller: `nest g controller modules/module-name`
4. Create DTOs in `modules/module-name/dto/`
5. Add validation decorators to DTOs
6. Implement business logic in service
7. Add routes in controller with proper guards

### Adding Authentication to Routes
```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Get('protected')
async protectedRoute(@CurrentUser() user) {
  // user object available from JWT payload
}
```

### Adding Swagger Documentation
```typescript
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('module-name')
@Controller('module-name')
export class ModuleController {

  @ApiOperation({ summary: 'Description of endpoint' })
  @ApiBearerAuth()
  @Get()
  async getAll() {
    // ...
  }
}
```

### Adding Caching to Routes

**Manual caching with CacheService:**
```typescript
import { CacheService } from '../cache/cache.service';

@Injectable()
export class MyService {
  constructor(private readonly cacheService: CacheService) {}

  async getExpensiveData(id: string) {
    const cacheKey = `expensive-data:${id}`;

    // Try cache first
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    // Fetch and cache
    const data = await this.fetchFromDatabase(id);
    await this.cacheService.set(cacheKey, data, '30m');
    return data;
  }
}
```

**Automatic HTTP caching with interceptor:**
```typescript
import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { HttpCacheInterceptor } from '../../common/cache/http-cache.interceptor';
import { CacheConfig } from '../../common/cache/cache-config.decorator';

@Controller('data')
@UseInterceptors(HttpCacheInterceptor)
export class DataController {

  @Get()
  @CacheConfig({ ttl: '10m' })  // Custom TTL
  async getAll() {
    // This GET endpoint will be automatically cached
    return this.dataService.getAll();
  }

  @Get('user-specific')
  @CacheConfig({ ttl: '5m', userSpecific: true })
  async getUserData(@CurrentUser() user) {
    // Cache per user
    return this.dataService.getUserData(user.userId);
  }
}
```

**Invalidating cache:**
```typescript
// Delete specific key
await this.cacheService.delete('expensive-data:123');

// Delete all keys matching pattern
await this.cacheService.deletePattern('expensive-data:*');

// Clear all cache
await this.cacheService.clear();
```

## Dependencies to Note

- **axios-retry**: Automatic retry logic for HTTP requests
- **qrcode**: QR code generation (likely for 2FA or similar)
- **mongoose**: MongoDB ODM
- **passport**: Authentication middleware
- **cache-manager**: Caching abstraction layer

## Tips for Working with This Codebase

1. **Always validate inputs**: Use class-validator in DTOs
2. **Use proper HTTP status codes**: NestJS provides decorators like `@HttpCode()`
3. **Leverage dependency injection**: Keep services testable and modular
4. **Follow existing patterns**: Check existing modules for consistency
5. **Update Swagger docs**: Keep API documentation in sync with changes
6. **Test authentication**: Ensure proper guards are applied to protected routes
7. **Check error handling**: Use appropriate error codes and messages
8. **Consider caching**: Add caching for expensive operations (database queries, external API calls)
9. **Log appropriately**: Use NestJS logger with proper log levels
10. **Environment-aware code**: Use ConfigService for environment-specific behavior
11. **Redis best practices**:
    - Always set appropriate TTLs to prevent stale data
    - Use meaningful cache key patterns (e.g., `resource:id:action`)
    - Invalidate cache when data is updated/deleted
    - Monitor RedisInsight for cache hit/miss ratios
    - Ensure Redis Docker container is running before starting the app
