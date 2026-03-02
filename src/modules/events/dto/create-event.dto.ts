import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateEventDto {
  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  eventDate: string;

  @ApiProperty({ type: Number })
  @IsNumber()
  ticketPrice: number;

  @ApiProperty({ type: Number })
  @IsNumber()
  availableSeats: number;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ type: File })
  imageUrl: File;
}
