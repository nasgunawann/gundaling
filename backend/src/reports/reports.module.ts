import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ImageController } from './image.controller';
import { ReportsService } from './reports.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReportsController, ImageController],
  providers: [ReportsService],
})
export class ReportsModule {}
