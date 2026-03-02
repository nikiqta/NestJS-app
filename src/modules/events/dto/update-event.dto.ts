import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class UpdateEventDto {
  @ApiPropertyOptional({ type: String })
  @IsNotEmpty()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ type: String })
  @IsNotEmpty()
  @IsString()
  eventDate?: string;

  @ApiPropertyOptional({ type: Number })
  @IsNumber()
  ticketPrice?: number;

  @ApiPropertyOptional({ type: Number })
  @IsNumber()
  availableSeats?: number;

  @ApiPropertyOptional({ type: String })
  @IsNotEmpty()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: String })
  @IsNotEmpty()
  @IsString()
  imageUrl?: string;
}
