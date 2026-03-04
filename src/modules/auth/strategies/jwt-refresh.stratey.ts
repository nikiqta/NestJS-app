import { Injectable, Res, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { AuthService } from '../auth.service';

function extractRefreshToken(req: Request): string | null {
  // 1) Web: cookie
  const cookieToken = req.cookies?.Refresh;
  if (cookieToken) return cookieToken;

  // 2) Mobile: Authorization header
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim();

  // 3) Optional: body
  const bodyToken = (req.body as any)?.refreshToken;
  if (typeof bodyToken === 'string' && bodyToken.length > 0) return bodyToken;

  return null;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => extractRefreshToken(req),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('JWT_REFRESH_TOKEN_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: { sub: string }) {
    const refreshToken = extractRefreshToken(request);
    if (!refreshToken) throw new UnauthorizedException('Missing refresh token');

    return this.authService.verifyUserRefreshToken(refreshToken, payload.sub);
  }
}
