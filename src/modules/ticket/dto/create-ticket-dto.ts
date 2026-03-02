import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTicketDto {
  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  owner: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  paymentCardNumber: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  relatedEvent: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  seat: number;
}
