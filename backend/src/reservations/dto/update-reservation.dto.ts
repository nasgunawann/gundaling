import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class UpdateReservationDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['Confirmed', 'Seated', 'Cancelled'])
  status: string;
}
