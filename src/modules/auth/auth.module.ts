import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from 'src/modules/auth/strategies/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Session, SessionSchema } from 'src/schemas/session.schema';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.stratey';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: `${configService.get<any>(
            'session.accessTokenExpirationPeriodInMinutes',
          )}m`,
        },
      }),
    }),
    UserModule,
  ],
  providers: [AuthService, JwtStrategy, LocalStrategy, JwtRefreshStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
