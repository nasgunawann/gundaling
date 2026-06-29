import { IsNotEmpty, IsString } from 'class-validator';

export class ResetPinDto {
  @IsString()
  @IsNotEmpty()
  pin: string;
}
