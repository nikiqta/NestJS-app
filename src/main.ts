import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on port: ${process.env.PORT ?? 3000}`);
}

bootstrap();
