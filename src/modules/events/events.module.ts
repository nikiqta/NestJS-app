import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Event, EventSchema } from 'src/schemas/event.schema';
import { Comment, CommentSchema } from 'src/schemas/comment.schema';
import { Ticket, TicketSchema } from 'src/schemas/ticket.schema';

@Module({
  imports: [
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
