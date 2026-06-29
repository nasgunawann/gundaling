import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  async findAll() {
    return this.ordersService.findAll();
  }

  @Post()
  async create(
    @Body() dto: CreateOrderDto,
    @Request() req: { user: { sub: string } },
  ) {
    return this.ordersService.create(dto, req.user.sub);
  }

  @Post(':id/transmit')
  async transmit(@Param('id') id: string) {
    return this.ordersService.transmit(id);
  }

  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.Chef, Role.Manager, Role.Server)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto);
  }
}
