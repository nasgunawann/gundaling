import { IsNotEmpty, IsString, IsIn, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  employeeId?: string;

  @IsString()
  @IsOptional()
  @IsIn(['Server', 'Manager', 'Chef'])
  role?: 'Server' | 'Manager' | 'Chef';
}
