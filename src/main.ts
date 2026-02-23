import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { levelToNestLevels } from './common/log/log-levels';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService>(ConfigService);
  const logLevel = configService.get<Record<string, string>>('logLevel', {
    level: 'debug',
  });

  app.useGlobalPipes(new ValidationPipe());

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

  await app.listen(configService.get('port', 3000));
  console.log(`Application is running on port: ${configService.get('port')}`);
}

bootstrap();
