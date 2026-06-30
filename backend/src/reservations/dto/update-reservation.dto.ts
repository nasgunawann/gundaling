import { IsString, IsNotEmpty, IsIn, IsOptional, IsInt } from 'class-validator';

export class UpdateReservationDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  phone?: string;

  @IsOptional()
  @IsInt()
  guests?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  tableId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  time?: string;

  @IsOptional()
  @IsString()
  @IsIn(['Confirmed', 'Seated', 'Cancelled', 'Completed'])
  status?: string;
}
