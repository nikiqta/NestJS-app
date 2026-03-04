const path = require('path');
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createFile, deleteFile, readFile } from 'src/helpers';
import { Comment } from 'src/schemas/comment.schema';
import { Event } from 'src/schemas/event.schema';
import { Ticket } from 'src/schemas/ticket.schema';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class EventsService implements OnModuleInit {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectModel(Event.name) private eventModel: Model<Event>,
    @InjectModel(Ticket.name) private ticketModel: Model<Ticket>,
    @InjectModel(Comment.name) private commentModel: Model<Comment>,
    private cacheService: CacheService,
  ) {}

  async onModuleInit() {
    console.log('Event Module initialized');
    // Simulate async initialization logic
  }

  async createEvent(userId, req) {
    try {
      const eventObj = req.body;
      const file = req.file;

      const newEvent = await this.eventModel.create({
        ...eventObj,
        ...(userId ? { creator: userId } : {}),
        status: 'Approved', // -> This must be romoved as it is temporary work around
      });

      const fileExtension = file.originalname.split('.').reverse()[0];
      const fileName = `${newEvent._id}.${fileExtension}`;
      const completeFilePath = path.resolve(
        __dirname,
        '..',
        '..',
        'data',
        'events',
        fileName,
      );
      await createFile(file.path, completeFilePath);
      newEvent.imageUrl = fileName;
      newEvent.save();

      // Invalidate cache
      await this.cacheService.deletePattern('cache:events:*');
      await this.cacheService.deletePattern('cache:events:unapproved:*');

      return {
        message: 'Event created successfully!',
      };
    } catch (error) {
      this.logger.error('Failed to create event:', {
        error: error.message,
        userId,
        stack: error.stack,
      });
      throw new Error(error);
    }
  }

  async editEvent(eventId, req) {
    try {
      const data = req.body;
      const [file] = req.files;

      if (data?.imageUrl) {
        const event = await this.eventModel.findById(eventId);
        if (!event) {
          throw new NotFoundException();
        }
        const completeFilePath = path.resolve(
          __dirname,
          '..',
          '..',
          'data',
          'events',
          event.imageUrl,
        );
        await deleteFile(completeFilePath);
      }

      const updatedEvent = await this.eventModel.findByIdAndUpdate(eventId, {
        ...data,
        // status: "Waiting For Approval",
        status: 'Approved', // -> This must be romoved as it is temporary work around
      });

      if (data?.imageUrl && updatedEvent) {
        const fileExtension = file.originalname.split('.').reverse()[0];
        const fileName = `${updatedEvent._id}.${fileExtension}`;
        const completeFilePath = path.resolve(
          __dirname,
          '..',
          '..',
          'data',
          'events',
          fileName,
        );
        await createFile(file.path, completeFilePath);
        updatedEvent.imageUrl = fileName;
        updatedEvent.save();
      }

      // Invalidate cache
      await this.cacheService.deletePattern('cache:events:*');
      await this.cacheService.deletePattern('cache:events:unapproved:*');
      await this.cacheService.deletePattern(`cache:events:${eventId}:*`);
      await this.cacheService.deletePattern('cache:user:*:events:userEvents:*');

      return {
        message: 'Event updated successfully!',
      };
    } catch (error) {
      this.logger.error('Failed to edit event:', {
        error: error.message,
        eventId,
        stack: error.stack,
      });

      if (error instanceof NotFoundException) {
        throw new NotFoundException('Event not found');
      }

      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async getEventById(id): Promise<Event> {
    try {
      const event = await this.eventModel.findById(id);

      if (!event) {
        throw new NotFoundException();
      }

      const fileExtension = event.imageUrl.split('.').reverse()[0];
      const readStream = await readFile(
        path.join(__dirname, '..', '..', 'data', 'events', event.imageUrl),
      );
      event.imageUrl = `data:${
        fileExtension === 'svg' ? 'image/svg+xml' : 'image/png'
      };base64,${readStream.toString('base64')}`;

      return event;
    } catch (error) {
      this.logger.error('Failed to retrieve event:', {
        error: error.message,
        eventId: id,
        stack: error.stack,
      });

      if (error instanceof NotFoundException) {
        throw new NotFoundException('Event not found');
      }

      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async deleteEventById(id) {
    try {
      const event = await this.eventModel.findByIdAndDelete(id);

      if (!event) {
        if (!event) {
          throw new NotFoundException();
        }
      }

      const completeFilePath = path.resolve(
        __dirname,
        '..',
        '..',
        'data',
        'events',
        event.imageUrl,
      );

      await deleteFile(completeFilePath);
      await this.commentModel.findOneAndDelete({ relatedEvent: id });
      await this.ticketModel.findOneAndDelete({ relatedEvent: id });

      // Invalidate cache
      await this.cacheService.deletePattern('cache:events:*');
      await this.cacheService.deletePattern('cache:ticket:*');
      await this.cacheService.deletePattern('cache:comment:*');

      return {
        message: 'Event deleted successfully!',
      };
    } catch (error) {
      this.logger.error('Failed to delete event:', {
        error: error.message,
        eventId: id,
        stack: error.stack,
      });

      if (error instanceof NotFoundException) {
        throw new NotFoundException('Event not found');
      }

      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async findAll(): Promise<Event[]> {
    try {
      const events = await this.eventModel
        .find()
        .where('status')
        .ne('Waiting For Approval');

      for (const [index, event] of events.entries()) {
        const fileExtension = event.imageUrl.split('.').reverse()[0];
        const readStream = await readFile(
          path.join(__dirname, '..', '..', 'data', 'events', event.imageUrl),
        );
        events[index].imageUrl = `data:${
          fileExtension === 'svg' ? 'image/svg+xml' : 'image/png'
        };base64,${readStream.toString('base64')}`;
      }

      return events;
    } catch (error) {
      this.logger.error('Failed to retrieve events:', {
        error: error.message,
        stack: error.stack,
      });

      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async findAllUnapprovedEvents(): Promise<Event[]> {
    try {
      const events = await this.eventModel
        .find()
        .where('status')
        .ne('Approved');

      for (const [index, event] of events.entries()) {
        const fileExtension = event.imageUrl.split('.').reverse()[0];
        const readStream = await readFile(
          path.join(__dirname, '..', '..', 'data', 'events', event.imageUrl),
        );
        events[index].imageUrl = `data:${
          fileExtension === 'svg' ? 'image/svg+xml' : 'image/png'
        };base64,${readStream.toString('base64')}`;
      }

      return events;
    } catch (error) {
      this.logger.error('Failed to retrieve unapproved events:', {
        error: error.message,
        stack: error.stack,
      });

      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async findUserEvents(userId): Promise<Event[]> {
    try {
      const events = await this.eventModel.find({ creator: userId });

      for (const [index, event] of events.entries()) {
        const fileExtension = event.imageUrl.split('.').reverse()[0];
        const readStream = await readFile(
          path.join(__dirname, '..', '..', 'data', 'events', event.imageUrl),
        );
        events[index].imageUrl = `data:${
          fileExtension === 'svg' ? 'image/svg+xml' : 'image/png'
        };base64,${readStream.toString('base64')}`;
      }

      return events;
    } catch (error) {
      this.logger.error('Failed to retrieve user events:', {
        error: error.message,
        userId,
        stack: error.stack,
      });

      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async approveEvent(eventId): Promise<void> {
    try {
      await this.eventModel.findByIdAndUpdate(eventId, {
        status: 'Approved',
      });

      // Invalidate cache
      await this.cacheService.deletePattern('cache:events:*');
      await this.cacheService.deletePattern('cache:events:unapproved:*');
    } catch (error) {
      this.logger.error('Failed to approve event:', {
        error: error.message,
        eventId,
        stack: error.stack,
      });

      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }
}
