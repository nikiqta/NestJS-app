import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { levelToNestLevels } from './common/log/log-levels';
import cookieParser from 'cookie-parser';
import { Environment } from './config/validation.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService>(ConfigService);
  const logLevel = configService.get<Record<string, string>>('logLevel', {
    level: 'debug',
  });

  // Enable CORS
  app.enableCors({
    origin:
      process.env.APP_ENV === Environment.Dev
        ? 'http://192.168.214.147:8081'
        : process.env.CORS_ORIGIN || ['http://localhost:3000'], // Allow only this origin
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allowed methods
    credentials: true, // Allow cookies to be sent
    allowedHeaders: 'Content-Type, Authorization', // Allowed headers
  });

  app.use((req, res, next) => {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=604800; includeSubDomains',
    );
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', 1);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    res.setHeader('Access-Control-Allow-Origin', 'http://192.168.214.147:8081');
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // enables class-transformer
      whitelist: true, // strips properties not in DTO
      forbidNonWhitelisted: true, // throws error on extra props
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Insurance BFF API')
    .setDescription(
      'Integration layer between FE and downstream insurance services',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const doc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('/docs', app, doc);

  app.useLogger(levelToNestLevels[logLevel.level] ?? ['log', 'warn', 'error']);

  app.use(cookieParser());

  await app.listen(configService.get('port', 3000));
  console.log(`Application is running on port: ${configService.get('port')}`);
}

bootstrap();
