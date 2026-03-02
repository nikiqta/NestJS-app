import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCommentDto, EditCommentDto } from './dto/create-comment-dto';

@Controller('comment')
export class CommentController {
  constructor(private ticketService: CommentService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createComment(@Body() commentData: CreateCommentDto, @Res() res) {
    return await this.ticketService.createComment(commentData, res);
  }

  @Put('edit')
  @UseGuards(JwtAuthGuard)
  async editComment(@Body() commentData: EditCommentDto) {
    return await this.ticketService.editComment(commentData);
  }

  @Delete(':commentId')
  @UseGuards(JwtAuthGuard)
  async removeComment(@Param('commentId') commentId: string) {
    return await this.ticketService.removeComment(commentId);
  }

  @Get(':eventId')
  @UseGuards(JwtAuthGuard)
  async getCommentsStream(
    @Param('eventId') eventId: string,
    @Req() req,
    @Res() res,
  ) {
    return await this.getCommentsStream(eventId, req, res);
  }

  @Get('events/:eventId')
  @UseGuards(JwtAuthGuard)
  async getEventComments(@Param('eventId') eventId: string) {
    return await this.getEventComments(eventId);
  }
}
