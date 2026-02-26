import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  handleRequest(err, user, info) {
    // You can throw an exception based on either "info" or "err" arguments
    if (err || !user) {
      this.logger.error('Login error:', {
        error: err?.message || info?.message,
        userId: user?.id,
        stack: err?.stack || info?.stack,
      });
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
