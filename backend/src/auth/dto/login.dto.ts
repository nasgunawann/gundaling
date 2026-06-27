import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsNotEmpty()
  pin: string;
}
