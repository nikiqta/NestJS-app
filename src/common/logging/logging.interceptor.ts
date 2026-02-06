import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request & { requestId?: string }>();
    const res = http.getResponse<{ statusCode?: number }>();

    const start = Date.now();

    // Best effort extraction (express)
    const method = (req as any).method;
    const url = (req as any).originalUrl ?? (req as any).url;
    const requestId = (req as any).requestId;

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          const status = (res as any).statusCode;
          this.logger.log(
            `${method} ${url} ${status} ${ms}ms${requestId ? ` requestId=${requestId}` : ''}`,
          );
        },
        error: (err) => {
          const ms = Date.now() - start;
          const status = (err && (err.status || err.statusCode)) ?? 500;
          this.logger.warn(
            `${method} ${url} ${status} ${ms}ms${requestId ? ` requestId=${requestId}` : ''}`,
          );
        },
      }),
    );
  }
}
