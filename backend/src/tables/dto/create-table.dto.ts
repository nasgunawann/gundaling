import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class CreateTableDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @IsNotEmpty()
  seats: number;

  @IsString()
  @IsNotEmpty()
  shape: string;

  @IsNumber()
  @IsNotEmpty()
  posX: number;

  @IsNumber()
  @IsNotEmpty()
  posY: number;

  @IsString()
  @IsOptional()
  status?: string;
}
