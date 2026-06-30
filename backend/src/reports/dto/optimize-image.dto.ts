import { IsNotEmpty, IsString } from 'class-validator';

export class OptimizeImageDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  w: string;

  @IsString()
  @IsNotEmpty()
  q: string;
}
