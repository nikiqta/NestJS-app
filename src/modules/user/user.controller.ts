import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserDto } from './dto/register-user.dto';

@Controller('api/user')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('register')
  async createUser(@Body() request: RegisterUserDto) {
    return this.userService.register(request);
  }
}
