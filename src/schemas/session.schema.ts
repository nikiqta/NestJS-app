import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model, Schema as MongooseSchema } from 'mongoose';

export type SessionDocument = HydratedDocument<Session>;

export interface SessionModel extends Model<SessionDocument> {}

@Schema()
export class Session {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, ref: 'User' })
  userId;

  @Prop({ type: MongooseSchema.Types.Date, default: Date.now })
  creationDate;

  @Prop({ type: MongooseSchema.Types.Date, default: Date.now })
  updatedDate;

  @Prop({ type: MongooseSchema.Types.Array, required: true })
  refreshToken;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
