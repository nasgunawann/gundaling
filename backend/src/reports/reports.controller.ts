import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { DailyReportDto } from './dto/daily-report.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('daily')
  @UseGuards(RolesGuard)
  @Roles(Role.Manager)
  async getDailyReport(@Query() query: DailyReportDto) {
    return this.reportsService.getDailyReport(query.date);
  }
}
