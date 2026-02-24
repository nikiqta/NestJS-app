import { Injectable, OnModuleInit } from '@nestjs/common';
import { Event } from 'src/schemas/event.schema';

@Injectable()
export class EventsService implements OnModuleInit {
  private readonly events: Event[] = [];

  async onModuleInit() {
    // Simulate async initialization logic
    console.log('CatsService initialized');
  }

  create(event: Event) {
    this.events.push(event);
  }

  findAll(): Promise<Event[]> {
    return Promise.resolve(this.events);
  }
}
