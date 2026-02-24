export class UpdateEventDto {
  readonly name?: string;
  readonly eventDate?: Date;
  readonly ticketPrice?: number;
  readonly availableSeats?: number;
  readonly description?: string;
  readonly imageUrl?: string;
}
