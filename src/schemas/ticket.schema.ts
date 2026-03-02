import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model, Schema as MongooseSchema } from 'mongoose';

export type TicketDocument = HydratedDocument<Ticket>;

export interface TicketModel extends Model<TicketDocument> {}

@Schema()
export class Ticket {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  owner;

  @Prop({ type: MongooseSchema.Types.Date, default: Date.now })
  creationDate;

  @Prop({ type: MongooseSchema.Types.String, required: true })
  paymentCardNumber;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Event' })
  relatedEvent;

  @Prop({ type: MongooseSchema.Types.String, required: true })
  seat;

  @Prop({ type: MongooseSchema.Types.String, required: true })
  qrImage;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);
