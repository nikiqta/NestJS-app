import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CatsService } from './modules/cats/cats.service';
import { CatsController } from './modules/cats/cats.controller';
import { CatsModule } from './modules/cats/cats.module';

@Module({
  imports: [
    // keep HttpModule global usage minimal; we wrap it in our own HttpClientModule too
    HttpModule,
    CatsModule,
  ],
  controllers: [CatsController],
  providers: [CatsService],
})
export class AppModule {}
