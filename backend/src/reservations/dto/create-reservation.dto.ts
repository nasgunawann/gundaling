import { IsString, IsNotEmpty, IsInt, IsDateString } from 'class-validator';

export class CreateReservationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsInt()
  @IsNotEmpty()
  guests: number;

  @IsString()
  @IsNotEmpty()
  tableId: string;

  @IsDateString()
  @IsNotEmpty()
  time: string;
}
