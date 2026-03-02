import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import bcrypt from 'bcryptjs';
import * as userSchema from 'src/schemas/user.schema';
import { RegisterUserDto } from './dto/register-user.dto';

@Injectable()
export class UserService implements OnModuleInit {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectModel(userSchema.User.name)
    private readonly userModel: userSchema.UserModel,
  ) {}

  async onModuleInit() {
    console.log('User module initialized');
    await this.userModel.seedAdminUser();
  }

  async register(user: RegisterUserDto) {
    try {
      // Check if the username already exists
      const existingUser = await this.userModel.findOne({
        username: user.username,
      });

      if (existingUser) {
        throw new HttpException('Username already exists', HttpStatus.CONFLICT);
      }

      // Hash the password before saving
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(user.password, salt);

      // Create a new user with hashed password
      const newUser = new this.userModel({
        ...user,
        hashedPassword,
      });

      return newUser.save();
    } catch (error) {
      this.logger.error('Failed to create user:', {
        error: error.message,
        email: user.email,
        stack: error.stack,
      });

      if (error instanceof HttpException) {
        throw new HttpException('Username already exists', HttpStatus.CONFLICT);
      }

      throw new InternalServerErrorException(
        'An unexpected error occurred while creating user',
      );
    }
  }

  async getUserById(
    id: string,
  ): Promise<{ user: userSchema.User; userId: string }> {
    try {
      const user = await this.userModel.findById(id).exec();

      if (!user) {
        throw new NotFoundException();
      }

      return { user, userId: id };
    } catch (error) {
      this.logger.error('Failed to fetch user:', {
        error: error.message,
        id,
        stack: error.stack,
      });

      if (error instanceof NotFoundException) {
        throw new NotFoundException('User not found');
      }

      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async getUserByUsername(username: string) {
    try {
      const user = await this.userModel
        .findOne({
          username,
        })
        .exec();

      if (!user) {
        throw new NotFoundException();
      }

      return user;
    } catch (error) {
      this.logger.error('Failed to fetch user:', {
        error: error.message,
        username,
        stack: error.stack,
      });

      if (error instanceof NotFoundException) {
        throw new NotFoundException('User not found');
      }

      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }
}
