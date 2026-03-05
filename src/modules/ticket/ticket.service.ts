import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { EventsService } from '../events/events.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ticket } from 'src/schemas/ticket.schema';
import { Event } from 'src/schemas/event.schema';
import { QRCode } from 'qrcode';

@Injectable()
export class TicketService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectModel(Event.name) private eventModel: Model<Event>,
    @InjectModel(Ticket.name) private ticketModel: Model<Ticket>,
  ) {}

  async createTicket(req) {
    try {
      const ticketObj = req.body;
      const opts = {
        errorCorrectionLevel: 'H',
        type: 'terminal',
        quality: 0.95,
        margin: 1,
        color: {
          dark: '#208698',
          light: '#FFF',
        },
      };

      const qrImage = await QRCode.toDataURL('Hi testing QR code', opts);

      await this.ticketModel
        .create({
          ...ticketObj,
          qrImage,
        })
        .then((ticket) => {
          const id = ticket.relatedEvent;
          this.eventModel
            .findByIdAndUpdate(id, {
              $push: {
                participants: ticket.owner,
                reservedSeats: ticket.seat,
              },
            })
            .catch((error) => {
              throw new InternalServerErrorException();
            });
        });

      return {
        message: 'Ticket Created successfully.',
      };
    } catch (error) {
      this.logger.error('Failed to create ticket:', {
        error: error.message,
        owner: req.body.owner,
        stack: error.stack,
      });
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async fetchEventTickets(relatedEvent): Promise<Ticket[]> {
    try {
      const tickets = this.ticketModel
        .find({ relatedEvent: relatedEvent })
        .populate('owner')
        .populate('relatedEvent');

      return tickets;
    } catch (error) {
      this.logger.error('Failed to get all event tickets:', {
        error: error.message,
        stack: error.stack,
      });
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async fetchUserTickets(userId): Promise<Ticket[]> {
    try {
      const tickets = this.ticketModel
        .find({ owner: userId })
        .populate('relatedEvent', {
          name: 1,
          ticketPrice: 1,
          imageUrl: 1,
          eventDate: 1,
        });

      return tickets;
    } catch (error) {
      this.logger.error('Failed to get all user tickets:', {
        error: error.message,
        stack: error.stack,
      });
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }
}
