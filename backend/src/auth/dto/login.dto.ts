import { IsInt, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsInt()
  @IsNotEmpty()
  id: number;

  @IsNotEmpty()
  pin: string;
}
