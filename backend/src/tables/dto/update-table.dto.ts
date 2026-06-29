import { IsNumber, IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateTableDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  seats?: number;

  @IsString()
  @IsOptional()
  shape?: string;

  @IsNumber()
  @IsOptional()
  pos_x?: number;

  @IsNumber()
  @IsOptional()
  pos_y?: number;

  @IsString()
  @IsOptional()
  @IsIn(['Available', 'Occupied'])
  status?: string;
}
