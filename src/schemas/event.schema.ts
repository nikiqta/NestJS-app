import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type EventDocument = HydratedDocument<Event>;

@Schema()
export class Event {
  @Prop()
  name: MongooseSchema.Types.String;

  @Prop()
  status: MongooseSchema.Types.String;

  @Prop()
  creator: MongooseSchema.Types.ObjectId;

  @Prop()
  creationDate: MongooseSchema.Types.Date;

  @Prop()
  eventDate: MongooseSchema.Types.Date;

  @Prop()
  ticketPrice: MongooseSchema.Types.Number;

  @Prop()
  availableSeats: MongooseSchema.Types.Number;

  @Prop()
  reservedSeats: MongooseSchema.Types.String;

  @Prop()
  description: MongooseSchema.Types.ObjectId;

  @Prop()
  participants: MongooseSchema.Types.ObjectId;

  @Prop()
  imageUrl: MongooseSchema.Types.String;
}

export const EventSchema = SchemaFactory.createForClass(Event);
