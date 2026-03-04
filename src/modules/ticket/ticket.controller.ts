import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TicketService } from './ticket.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTicketDto } from './dto/create-ticket-dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from 'src/schemas/user.schema';
import { Ticket } from 'src/schemas/ticket.schema';

@Controller('api/ticket')
export class TicketController {
  constructor(private ticketService: TicketService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  createTiket(@Body() createTicketDto: CreateTicketDto, @Req() req) {
    this.ticketService.createTicket(req);
  }

  @Get('eventTickets/:eventId')
  @UseGuards(JwtAuthGuard)
  async fetchEventTickets(
    @Param('eventId') eventId: string,
  ): Promise<Ticket[]> {
    return await this.ticketService.fetchEventTickets(eventId);
  }

  @Get('userTickets/:userId')
  @UseGuards(JwtAuthGuard)
  async fetchUserTickets(
    @CurrentUser() body: { user: User; userId: string },
  ): Promise<Ticket[]> {
    return await this.ticketService.fetchUserTickets(body.userId);
  }
}
