import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { HttpClient } from './http.client';

@Module({
  imports: [
    HttpModule.register({
      timeout: 8000, // default timeout
      maxRedirects: 0,
    }),
  ],
  providers: [HttpClient],
  exports: [HttpClient],
})
export class HttpClientModule {}
