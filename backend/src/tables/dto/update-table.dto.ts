import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateTableDto {
  @IsNumber()
  @IsOptional()
  pos_x?: number;

  @IsNumber()
  @IsOptional()
  pos_y?: number;

  @IsString()
  @IsOptional()
  status?: string;
}
