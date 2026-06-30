import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDailyReport(dateStr?: string) {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    
    // Set boundaries to cover the entire day in local timezone
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Aggregate total sales and total paid orders count
    const salesSummary = await this.prisma.order.aggregate({
      where: {
        status: 'paid',
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      _sum: {
        total: true,
      },
      _count: {
        id: true,
      },
    });

    const grandTotal = Number(salesSummary._sum.total || 0);
    const orderCount = salesSummary._count.id || 0;

    // Settle grandTotal breakdown (Subtotal and 10% Service Charge)
    // grandTotal = subtotal + 0.1 * subtotal = 1.1 * subtotal
    // subtotal = grandTotal / 1.1
    const subtotal = grandTotal / 1.1;
    const serviceCharge = grandTotal - subtotal;

    // 2. Query top selling items grouped by product name
    const topItemsRaw = await this.prisma.orderItem.groupBy({
      by: ['productName', 'productId'],
      where: {
        order: {
          status: 'paid',
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      },
      _sum: {
        qty: true,
      },
      orderBy: {
        _sum: {
          qty: 'desc',
        },
      },
      take: 10,
    });

    const topItems = topItemsRaw.map(item => ({
      productId: item.productId,
      productName: item.productName,
      qty: item._sum.qty || 0,
    }));

    return {
      date: startOfDay.toISOString().split('T')[0],
      grandTotal,
      subtotal,
      serviceCharge,
      orderCount,
      topItems,
    };
  }
}
