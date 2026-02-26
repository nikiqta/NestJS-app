import { MiddlewareConsumer, Module, ValidationPipe } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerMiddleware } from './common/logging/logger.middleware';
import { LoggingInterceptor } from './common/logging/logging.interceptor';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { RequestIdMiddleware } from './common/logging/request-id.middleware';
import { ApiErrorFilter } from './common/errors/api-exception.filter';
import configuration from './config/configuration';
import cronConfig from './config/cron.config';
import logLevelConfig from './config/log-level.config';
import mongoDbConfig from './config/mongodb.config';
import { Environment, validate } from './config/validation.config';
import { MongodbConfigService } from './database/mongodb.config.service';
import sessionConfig from './config/jwt.config';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate,
      envFilePath: ['.env', `.env.${process.env.APP_ENV ?? Environment.Dev}`],
      load: [
        configuration,
        cronConfig,
        logLevelConfig,
        mongoDbConfig,
        sessionConfig,
      ],
      isGlobal: true,
      cache: true,
      expandVariables: true,
    }),
    MongooseModule.forRootAsync({
      useClass: MongodbConfigService,
    }),
    // keep HttpModule global usage minimal; we wrap it in our own HttpClientModule too
    HttpModule,
    AuthModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: ApiErrorFilter,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware, LoggerMiddleware).forRoutes('*');
  }
}
