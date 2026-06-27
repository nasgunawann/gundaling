import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { PosGateway } from '../events/pos.gateway';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private posGateway: PosGateway,
  ) {}

  async findAll() {
    return this.prisma.order.findMany({
      where: {
        status: { not: 'paid' },
      },
      include: {
        table: true,
        user: {
          select: { id: true, name: true, role: true, email: true },
        },
        items: {
          include: { product: true },
        },
      },
    });
  }

  async create(dto: CreateOrderDto, userId: string) {
    const table = await this.prisma.table.findUnique({
      where: { id: dto.table_id },
    });
    if (!table) {
      throw new NotFoundException(`Table with ID ${dto.table_id} not found`);
    }

    // Always create a new Order for split-ticket tracking
    const order = await this.prisma.order.create({
      data: {
        tableId: table.id,
        userId,
        status: 'pending',
        total: 0,
      },
    });

    await this.prisma.table.update({
      where: { id: table.id },
      data: { status: 'Occupied' },
    });

    const productIds = dto.items.map((i) => i.product_id);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    const productsMap = new Map(products.map((p) => [p.id, p]));

    for (const item of dto.items) {
      const product = productsMap.get(item.product_id);
      if (!product) continue;
      const sent = item.sent ?? false;

      await this.prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.product_id,
          productName: product.name,
          qty: item.qty,
          unitPrice: product.price,
          sent,
          note: item.note ?? null,
        },
      });
    }

    await this.recalculateOrderTotal(order.id);

    const updatedOrder = await this.prisma.order.findUnique({
      where: { id: order.id },
      include: {
        table: true,
        user: {
          select: { id: true, name: true, role: true, email: true },
        },
        items: {
          include: { product: true },
        },
      },
    });

    this.posGateway.emitEvent('OrderSent', updatedOrder);

    return updatedOrder;
  }

  async transmit(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { table: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    if (order.status === 'paid') {
      throw new BadRequestException('Cannot transmit items to a paid order.');
    }

    const unsentItems = await this.prisma.orderItem.findMany({
      where: { orderId: order.id, sent: false },
    });

    if (unsentItems.length > 0) {
      await this.prisma.orderItem.updateMany({
        where: { orderId: order.id, sent: false },
        data: { sent: true },
      });

      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'pending' },
      });

      await this.recalculateOrderTotal(order.id);

      await this.prisma.table.update({
        where: { id: order.tableId },
        data: { status: 'Occupied' },
      });

      const updatedOrder = await this.prisma.order.findUnique({
        where: { id: order.id },
        include: {
          table: true,
          user: {
            select: { id: true, name: true, role: true, email: true },
          },
          items: {
            include: { product: true },
          },
        },
      });

      this.posGateway.emitEvent('OrderSent', updatedOrder);
      return updatedOrder;
    }

    return this.prisma.order.findUnique({
      where: { id: order.id },
      include: {
        table: true,
        user: {
          select: { id: true, name: true, role: true, email: true },
        },
        items: {
          include: { product: true },
        },
      },
    });
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { table: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    await this.prisma.order.update({
      where: { id },
      data: { status: dto.status as OrderStatus },
    });

    if (dto.status === 'paid') {
      await this.prisma.table.update({
        where: { id: order.tableId },
        data: { status: 'Available' },
      });
      await this.prisma.orderItem.updateMany({
        where: { orderId: order.id },
        data: { sent: true },
      });
    }

    const updatedOrder = await this.prisma.order.findUnique({
      where: { id: order.id },
      include: {
        table: true,
        user: {
          select: { id: true, name: true, role: true, email: true },
        },
        items: {
          include: { product: true },
        },
      },
    });

    if (dto.status === 'paid') {
      this.posGateway.emitEvent('OrderPaid', updatedOrder);
    } else if (dto.status === 'preparing') {
      this.posGateway.emitEvent('OrderPreparing', updatedOrder);
    } else if (dto.status === 'ready') {
      this.posGateway.emitEvent('OrderReady', updatedOrder);
    } else if (dto.status === 'served') {
      this.posGateway.emitEvent('OrderServed', updatedOrder);
    }

    return updatedOrder;
  }

  private async recalculateOrderTotal(orderId: string) {
    const items = await this.prisma.orderItem.findMany({
      where: { orderId },
    });
    const subtotal = items.reduce(
      (acc, item) => acc + Number(item.unitPrice) * item.qty,
      0,
    );
    const total = subtotal * 1.1;

    await this.prisma.order.update({
      where: { id: orderId },
      data: { total },
    });
  }
}
