import { IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class LoginDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  id: number;

  @IsNotEmpty()
  pin: string;
}
