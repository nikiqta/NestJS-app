import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { EventsService } from '../events/events.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment } from 'src/schemas/comment.schema';
import { Event } from 'src/schemas/event.schema';

let clients = {};

function sendEventsToAll(newData, eventId) {
  clients[eventId].forEach((client) =>
    client.res.write(
      `data: ${JSON.stringify({ chunk: newData, channel: eventId })}\n\n`,
    ),
  );
}

@Injectable()
export class CommentService {
  private readonly logger = new Logger(EventsService.name);
  constructor(
    @InjectModel(Event.name) private eventModel: Model<Event>,
    @InjectModel(Comment.name) private commentModel: Model<Comment>,
  ) {}

  async createComment(commentData, res) {
    try {
      const comment = await this.commentModel.create(commentData);
      const currentComment = await this.commentModel
        .findById(comment._id)
        .populate('creator');

      res.json(comment);

      return sendEventsToAll(currentComment, commentData.relatedEvent);
    } catch (error) {
      this.logger.error('Failed to create comment:', {
        error: error.message,
        owner: commentData.creator,
        stack: error.stack,
      });
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async editComment(commentData) {
    try {
      await this.commentModel.findByIdAndUpdate(commentData.id, {
        ...commentData,
        isEdited: true,
      });
    } catch (error) {
      this.logger.error('Failed to edit comment:', {
        error: error.message,
        owner: commentData.creator,
        stack: error.stack,
      });
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async removeComment(commentId) {
    try {
      await this.commentModel.findByIdAndDelete(commentId);
    } catch (error) {
      this.logger.error('Failed to delete comment:', {
        error: error.message,
        commentId,
        stack: error.stack,
      });
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async getCommentsStream(eventId, req, res) {
    try {
      const headers = {
        'Content-Type': 'text/event-stream',
        Connection: 'keep-alive',
      };

      res.writeHead(200, headers);

      const comments = await this.commentModel
        .find({ relatedEvent: eventId })
        .sort({ creationDate: -1 })
        .populate('creator');

      const data = `data: ${JSON.stringify({
        chunk: comments,
        channel: eventId,
      })}\n\n`;
      res.write(data);

      const clientId = Date.now();

      const newClient = {
        id: clientId,
        res,
      };

      if (!clients[eventId]) {
        clients[eventId] = [];
      }

      clients[eventId].push(newClient);

      req.on('close', () => {
        console.log(`${clientId} Connection closed`);
        Object.keys(clients).forEach((client) => {
          clients[client] = clients[client].filter((c) => c.id !== clientId);
        });
      });
    } catch (error) {
      this.logger.error('Failed to get comments stream:', {
        error: error.message,
        eventId,
        stack: error.stack,
      });
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async getEventComments(eventId) {
    try {
      await this.commentModel
        .find({ relatedEvent: eventId })
        .sort({ creationDate: -1 })
        .populate('creator');
    } catch (error) {
      this.logger.error('Failed to fetch event comments:', {
        error: error.message,
        eventId: eventId,
        stack: error.stack,
      });
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }
}
