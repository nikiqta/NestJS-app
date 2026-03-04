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
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventsService } from './events.service';
import { Event } from 'src/schemas/event.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from 'src/schemas/user.schema';

@Controller('api/events')
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createEvent(
    @Body() createEventDto: CreateEventDto,
    @CurrentUser() body: { user: User; userId: string },
    @Req() req,
  ) {
    return await this.eventsService.createEvent(body.userId, req);
  }

  @Post('approve/:id')
  @UseGuards(JwtAuthGuard)
  approveEvent(@Param('id', ParseUUIDPipe) id: string) {
    this.eventsService.approveEvent(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async editEvent(
    @Param('id') id: string,
    @Body() updateCatDto: UpdateEventDto,
    @Req() req,
  ) {
    return await this.eventsService.editEvent(id, req);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(): Promise<Event[]> {
    return await this.eventsService.findAll();
  }

  @Get('unapproved')
  @UseGuards(JwtAuthGuard)
  async findAllUnapprovedEvents(): Promise<Event[]> {
    return await this.eventsService.findAllUnapprovedEvents();
  }

  @Get('user/:id')
  @UseGuards(JwtAuthGuard)
  async findUserEvents(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Event[]> {
    return await this.eventsService.findUserEvents(id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.eventsService.getEventById(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    return await this.eventsService.deleteEventById(id);
  }
}
