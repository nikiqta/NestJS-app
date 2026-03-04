import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { compare, hash } from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schemas/user.schema';
import { Session } from 'src/schemas/session.schema';
import { getCookies } from '../../helpers';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectModel(Session.name) private sessionModel: Model<Session>,
  ) {}

  async onModuleInit() {
    console.log('Auth Module initialized');
    // Simulate async initialization logic
  }

  async login(user, req, res) {
    try {
      const cookies = getCookies(req);

      const expirationM = this.configService.getOrThrow<number>(
        'session.accessTokenExpirationPeriodInMinutes',
      );
      const refreshExpirationM = this.configService.getOrThrow<number>(
        'session.refreshTokenExpirationPeriodInMinutes',
      );

      const expiresAccessToken = new Date(Date.now() + expirationM * 60000);
      const expiresRefreshToken = new Date(
        Date.now() + refreshExpirationM * 60000,
      );

      const tokenPayload = { sub: user._id };
      const access_token = this.jwtService.sign(tokenPayload, {
        secret: this.configService.getOrThrow<string>('jwt.accessTokenSecret'),
        expiresIn: `${expirationM}m`,
      });

      const refresh_token = this.jwtService.sign(tokenPayload, {
        secret: this.configService.getOrThrow('jwt.refreshTokenSecret'),
        expiresIn: `${refreshExpirationM}m`,
      });

      const session = await this.sessionModel
        .findOne({ userId: user._id })
        .exec();

      if (!session) {
        try {
          await this.sessionModel.create({
            userId: user._id,
            refreshToken: [refresh_token],
          });
        } catch (error) {
          if (!error.statusCode) {
            error.statusCode = 500;
          }

          throw new UnauthorizedException('Failed to save refresh token');
        }
      } else {
        const newRefreshTokenArray = !cookies?.Refresh
          ? session.refreshToken
          : session.refreshToken.filter((rt) => rt !== cookies.Refresh);

        session.refreshToken = [...newRefreshTokenArray, refresh_token];
        session.updatedDate = new Date();
        await session.save();
      }

      res.cookie('Authentication', access_token, {
        httpOnly: true,
        secure: true, // this.configService.get('APP_ENV') === 'prod',
        sameSite: 'None',
        expires: expiresAccessToken,
      });

      res.cookie('Refresh', refresh_token, {
        httpOnly: true,
        secure: true, // this.configService.get('APP_ENV') === 'prod',
        sameSite: 'None',
        expires: expiresRefreshToken,
      });

      return {
        access_token,
        refresh_token,
        user: {
          userId: user._id.toString(),
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          avatar: user.avatar,
          roles: user.roles,
          isAdmin: user.roles.includes('Admin'),
        },
      };
    } catch (error) {
      this.logger.error('Login error:', {
        error: error.message,
        userId: user.id,
        stack: error.stack,
      });
      throw new UnauthorizedException(
        'Failed to process login. Please try again.',
      );
    }
  }

  async refresh(body, res) {
    const { user, refreshToken: currentRefreshToken } = body;

    try {
      const session = await this.sessionModel
        .findOne({
          refreshToken: currentRefreshToken,
        })
        .exec();

      if (!session) {
        throw new UnauthorizedException();
      }

      const newRefreshTokenArray = session?.refreshToken.filter(
        (rt) => rt !== currentRefreshToken,
      );

      await this.jwtService
        .verifyAsync(currentRefreshToken, {
          secret: this.configService.getOrThrow('jwt.refreshTokenSecret'),
        })
        .then(async (decoded) => {
          if (decoded.sub !== user._id.toString()) {
            throw new UnauthorizedException();
          }

          const expirationM = this.configService.getOrThrow<number>(
            'session.accessTokenExpirationPeriodInMinutes',
          );
          const refreshExpirationM = this.configService.getOrThrow<number>(
            'session.refreshTokenExpirationPeriodInMinutes',
          );

          const expiresAccessToken = new Date(Date.now() + expirationM * 60000);
          const expiresRefreshToken = new Date(
            Date.now() + refreshExpirationM * 60000,
          );

          const tokenPayload = { sub: user._id };
          const access_token = this.jwtService.sign(tokenPayload, {
            secret: this.configService.getOrThrow<string>(
              'jwt.accessTokenSecret',
            ),
            expiresIn: `${expirationM}m`,
          });

          const refresh_token = this.jwtService.sign(tokenPayload, {
            secret: this.configService.getOrThrow('jwt.refreshTokenSecret'),
            expiresIn: `${refreshExpirationM}m`,
          });

          session.refreshToken = [...newRefreshTokenArray, refresh_token];
          session.updatedDate = new Date();
          await session.save();

          res.cookie('Authentication', access_token, {
            httpOnly: true,
            secure: true, // this.configService.get('APP_ENV') === 'prod',
            sameSite: 'None',
            expires: expiresAccessToken,
          });

          res.cookie('Refresh', refresh_token, {
            httpOnly: true,
            secure: true, // this.configService.get('APP_ENV') === 'prod',
            sameSite: 'None',
            expires: expiresRefreshToken,
          });

          return res.json({
            access_token,
            refresh_token,
            user: {
              userId: user._id.toString(),
              username: user.username,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              avatar: user.avatar,
              roles: user.roles,
              isAdmin: user.roles.includes('Admin'),
            },
          });
        })
        .catch(async (error) => {
          session.refreshToken = [...newRefreshTokenArray];

          if (!session.refreshToken?.length) {
            await this.sessionModel.findByIdAndDelete(session.id);
          } else {
            await session.save();
          }

          throw new UnauthorizedException(error);
        });
    } catch (error) {
      this.logger.error('Login error:', {
        error: error.message,
        userId: user.id,
        stack: error.stack,
      });
      throw new UnauthorizedException(
        'Failed to process login. Please try again.',
      );
    }
  }

  async verifyUserRefreshToken(
    refreshToken: string,
    userId: string,
  ): Promise<{ user: User; refreshToken: string }> {
    try {
      if (!refreshToken) {
        throw new UnauthorizedException();
      }

      const currentRefreshToken = refreshToken;

      const session = await this.sessionModel
        .findOne({
          refreshToken: currentRefreshToken,
        })
        .exec();

      if (!session) {
        await this.jwtService
          .verifyAsync(currentRefreshToken, {
            secret: this.configService.getOrThrow('jwt.refreshTokenSecret'),
          })
          .then(async (decoded) => {
            const userSession = await this.sessionModel
              .findOne({
                userId: decoded.sub,
              })
              .exec();

            if (userSession) {
              userSession.refreshToken = [];
              await userSession.save();
            }
          })
          .catch((error) => {
            throw new UnauthorizedException(error);
          });

        throw new UnauthorizedException();
      }

      const { user } = await this.userService.getUserById(userId);

      return { user, refreshToken: currentRefreshToken };
    } catch (error) {
      this.logger.error('Verify user refresh token error', error);
      throw new UnauthorizedException('Refresh token is not valid');
    }
  }

  async verifyUser(username: string, password: string) {
    try {
      const user = await this.userService.getUserByUsername(username);
      const authenticated = compare(password, user?.hashedPassword);
      if (!authenticated) {
        throw new UnauthorizedException();
      }
      return user;
    } catch (error) {
      this.logger.error('Verify user error', error);
      throw new UnauthorizedException('Credentials are not valid');
    }
  }

  async session(userId, req, res) {
    const bearerToken = req.headers.authorization;
    const accessToken = bearerToken?.slice(7).trim();

    try {
      if (!accessToken) {
        throw new UnauthorizedException();
      }

      const decodedToken = await this.jwtService.verifyAsync(accessToken, {
        secret: this.configService.getOrThrow('jwt.accessTokenSecret'),
      });

      const { user } = await this.userService.getUserById(decodedToken?.sub);

      if (!user) {
        throw new UnauthorizedException();
      }

      res.json({
        user: {
          userId,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          avatar: user.avatar,
          roles: user.roles,
          isAdmin: user.roles.includes('Admin'),
        },
      });
    } catch (error) {
      this.logger.error('Sign out error:', {
        error: error.message,
        userId,
        stack: error.stack,
      });
      throw new UnauthorizedException('Failed to process sign out');
    }
  }

  async logout(userId, res) {
    try {
      res.clearCookie('Authentication', {
        httpOnly: true,
        sameSite: 'None',
        secure: true,
      });
      res.clearCookie('Refresh', {
        httpOnly: true,
        sameSite: 'None',
        secure: true,
      });

      await this.sessionModel
        .findOneAndDelete({
          userId,
        })
        .exec();

      res.status(200).json({ message: 'Successfully signed out' });
    } catch (error) {
      this.logger.error('Sign out error:', {
        error: error.message,
        userId,
        stack: error.stack,
      });
      throw new UnauthorizedException('Failed to process sign out');
    }
  }
}
