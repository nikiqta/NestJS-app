import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model, Schema as MongooseSchema } from 'mongoose';

export type CommentDocument = HydratedDocument<Comment>;

export interface CommentModel extends Model<CommentDocument> {}

@Schema()
export class Comment {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, ref: 'User' })
  creator;

  @Prop({ type: MongooseSchema.Types.Date, default: Date.now })
  creationDate;

  @Prop({ type: MongooseSchema.Types.String })
  content;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Event' })
  relatedEvent;

  @Prop({ type: MongooseSchema.Types.Boolean, default: false })
  isEdited;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
