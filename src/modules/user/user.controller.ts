import { Controller } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('cats')
export class UserController {
  constructor(private eventsService: UserService) {}
}
