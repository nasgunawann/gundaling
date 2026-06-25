import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateReservationDto {
  @IsString()
  @IsNotEmpty()
  status: string;
}
