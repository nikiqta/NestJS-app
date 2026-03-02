import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { MongooseModule } from '@nestjs/mongoose';
import { EventSchema } from 'src/schemas/event.schema';
import { Comment, CommentSchema } from 'src/schemas/comment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Comment.name, schema: CommentSchema },
      { name: Event.name, schema: EventSchema },
    ]),
  ],
  controllers: [CommentController],
  providers: [CommentService],
})
export class CommentModule {}
