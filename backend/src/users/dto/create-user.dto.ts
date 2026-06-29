import { IsNotEmpty, IsString, IsIn } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['Server', 'Manager', 'Chef'])
  role: 'Server' | 'Manager' | 'Chef';

  @IsString()
  @IsNotEmpty()
  pin: string;
}
