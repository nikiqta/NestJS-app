import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRefreshAuthGuard extends AuthGuard('jwt-refresh') {
  private readonly logger = new Logger(JwtRefreshAuthGuard.name);

  handleRequest(err, user, info) {
    // You can throw an exception based on either "info" or "err" arguments
    if (err || !user) {
      this.logger.error('Login error:', {
        error: err?.message || info?.message,
        stack: err?.stack || info?.stack,
      });
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
