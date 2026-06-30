import { IsOptional, IsString } from 'class-validator';

export class DailyReportDto {
  @IsString()
  @IsOptional()
  date?: string;
}
