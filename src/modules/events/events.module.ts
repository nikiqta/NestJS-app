import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Event, EventSchema } from 'src/schemas/event.schema';
import { Comment, CommentSchema } from 'src/schemas/comment.schema';
import { Ticket, TicketSchema } from 'src/schemas/ticket.schema';
import { CacheModule } from '../cache/cache.module';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

@Module({
  imports: [
    MulterModule.registerAsync({
      useFactory: () => {
        const uploadPath = join(process.cwd(), 'uploads');

        // Ensure upload directory exists
        if (!existsSync(uploadPath)) {
          mkdirSync(uploadPath, { recursive: true });
        }

        return {
          storage: diskStorage({
            destination: (req, file, cb) => {
              cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
              // Generate unique filename with timestamp
              const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
              const ext = extname(file.originalname);
              cb(null, `temp-${uniqueSuffix}${ext}`);
            },
          }),
        };
      },
    }),
    CacheModule,
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: Ticket.name, schema: TicketSchema },
    ]),
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
