import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { boolean } from 'joi';

export class CreateCommentDto {
  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  creator: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsUUID()
  relatedEvent: string;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  isEdited: boolean;
}

export class EditCommentDto {
  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  content: string;
}
