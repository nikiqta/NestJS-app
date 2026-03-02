import { Module } from '@nestjs/common';
import { TicketController } from './ticket.controller';
import { TicketService } from './ticket.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Ticket, TicketSchema } from 'src/schemas/ticket.schema';
import { Event, EventSchema } from 'src/schemas/event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ticket.name, schema: TicketSchema },
      { name: Event.name, schema: EventSchema },
    ]),
  ],
  controllers: [TicketController],
  providers: [TicketService],
})
export class TicketModule {}
