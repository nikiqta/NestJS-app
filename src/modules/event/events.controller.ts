import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventsService } from './events.service';
import { Event } from 'src/schemas/event.schema';

@Controller('cats')
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Post()
  @HttpCode(200)
  create(@Body() createEventDto: CreateEventDto) {
    // this.eventsService.create(createEventDto);
  }

  @Get()
  async findAll(): Promise<Event[]> {
    return await this.eventsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<string> {
    console.log(id);
    return Promise.resolve(`This action returns a #${id} cat`);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateCatDto: UpdateEventDto) {
    console.log(id);
    console.log(updateCatDto);
    return `This action updates a #${id} cat`;
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return `This action removes a #${id} cat`;
  }
}
