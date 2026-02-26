import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { levelToNestLevels } from './common/log/log-levels';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService>(ConfigService);
  const logLevel = configService.get<Record<string, string>>('logLevel', {
    level: 'debug',
  });

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || ['http://localhost:3000'], // Allow only this origin
    credentials: true, // Allow cookies to be sent
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
