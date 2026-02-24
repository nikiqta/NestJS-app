import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as userSchema from 'src/schemas/user.schema';

@Injectable()
export class UserService implements OnModuleInit {
  constructor(
    @InjectModel(userSchema.User.name)
    private readonly userModel: userSchema.UserModel,
  ) {}

  async onModuleInit() {
    console.log('aaa');
    await this.userModel.seedAdminUser();
  }
}
