/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  password: string;
}
