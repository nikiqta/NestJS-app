import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type EventDocument = HydratedDocument<Event>;

@Schema()
export class Event {
  @Prop({ type: MongooseSchema.Types.String, required: true, unique: true })
  name;

  @Prop({ type: MongooseSchema.Types.String, default: 'Waiting For Approval' })
  status;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, ref: 'User' })
  creator;

  @Prop({ type: MongooseSchema.Types.Date, default: Date.now })
  creationDate;

  @Prop({ type: MongooseSchema.Types.Date, required: true })
  eventDate;

  @Prop({ type: MongooseSchema.Types.Number, required: true })
  ticketPrice;

  @Prop({
    type: MongooseSchema.Types.Number,
    required: true,
    minLength: 10,
    maxLength: 100,
  })
  availableSeats;

  @Prop([{ type: MongooseSchema.Types.String }])
  reservedSeats;

  @Prop({ type: MongooseSchema.Types.ObjectId })
  description;

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'User' }])
  participants;

  @Prop({ type: MongooseSchema.Types.String, required: false })
  imageUrl;
}

export const EventSchema = SchemaFactory.createForClass(Event);
