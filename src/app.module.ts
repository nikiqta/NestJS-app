import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CatsModule } from './modules/cats/cats.module';
import { LoggerMiddleware } from './common/logging/logger.middleware';
import { LoggingInterceptor } from './common/logging/logging.interceptor';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { RequestIdMiddleware } from './common/logging/request-id.middleware';
import { ApiErrorFilter } from './common/errors/api-exception.filter';

@Module({
  imports: [
    // keep HttpModule global usage minimal; we wrap it in our own HttpClientModule too
    HttpModule,
    CatsModule,
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
    consumer
      .apply(RequestIdMiddleware, LoggerMiddleware)
      //  exclude certain routes from having middleware applied
      // .exclude(
      //   { path: 'cats', method: RequestMethod.GET },
      //   { path: 'cats', method: RequestMethod.POST },
      //   'cats/{*splat}',
      // )
      .forRoutes('*');
  }
}
