import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { TablesModule } from './tables/tables.module';
import { ReservationsModule } from './reservations/reservations.module';
import { OrdersModule } from './orders/orders.module';
import { EventsModule } from './events/events.module';
import { UsersModule } from './users/users.module';
import { ReportsModule } from './reports/reports.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        { name: 'default', limit: 5, ttl: 60000 },
      ],
      errorMessage: 'Too many requests. Please try again later.',
    }),
    PrismaModule,
    AuthModule,
    CategoriesModule,
    ProductsModule,
    TablesModule,
    ReservationsModule,
    OrdersModule,
    EventsModule,
    UsersModule,
    ReportsModule,
    AuditModule,
  ],
})
export class AppModule {}
