import { Test } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

describe('CatsController', () => {
  let eventsController: EventsController;
  let eventsService: EventsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [EventsService],
    }).compile();

    eventsService = moduleRef.get(EventsService);
    eventsController = moduleRef.get(EventsController);
  });

  describe('findAll', () => {
    it('should return an array of events', async () => {
      const result = [];
      jest
        .spyOn(eventsService, 'findAll')
        .mockImplementation(() => Promise.resolve(result));

      expect(await eventsController.findAll()).toBe(result);
    });
  });
});
