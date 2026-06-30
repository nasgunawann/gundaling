import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { PosGateway } from '../events/pos.gateway';
import { TableStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class TablesService {
  constructor(
    private prisma: PrismaService,
    private posGateway: PosGateway,
    private auditService: AuditService,
  ) {}

  async findAll() {
    return this.prisma.table.findMany();
  }

  async create(dto: CreateTableDto) {
    const table = await this.prisma.table.create({
      data: {
        name: dto.name,
        seats: dto.seats,
        shape: dto.shape,
        posX: dto.posX,
        posY: dto.posY,
        status: (dto.status as TableStatus) ?? TableStatus.Available,
      },
    });
    this.posGateway.emitEvent('table.created', table);
    return table;
  }

  async update(id: string, dto: UpdateTableDto) {
    const tableExists = await this.prisma.table.findUnique({
      where: { id },
    });
    if (!tableExists) {
      throw new NotFoundException(`Table with ID ${id} not found`);
    }

    const data: { name?: string; seats?: number; shape?: string; posX?: number; posY?: number; status?: TableStatus } = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.seats !== undefined) data.seats = dto.seats;
    if (dto.shape !== undefined) data.shape = dto.shape;
    if (dto.pos_x !== undefined) data.posX = dto.pos_x;
    if (dto.pos_y !== undefined) data.posY = dto.pos_y;
    if (dto.status !== undefined) data.status = dto.status as TableStatus;

    const table = await this.prisma.table.update({
      where: { id },
      data,
    });
    this.posGateway.emitEvent('table.updated', table);
    return table;
  }

  async remove(id: string) {
    const table = await this.prisma.table.findUnique({
      where: { id },
      include: {
        orders: { where: { status: { not: 'paid' } }, take: 1 },
        reservations: { where: { status: { in: ['Confirmed', 'Seated'] } }, take: 1 },
      },
    });

    if (!table) {
      throw new NotFoundException(`Table with ID ${id} not found`);
    }

    if (table.orders.length > 0) {
      throw new BadRequestException('Cannot delete table with active orders. Settle all bills first.');
    }

    if (table.reservations.length > 0) {
      throw new BadRequestException('Cannot delete table with active reservations. Cancel or complete them first.');
    }

    await this.auditService.log({
      action: 'TABLE_DELETED',
      entity: 'Table',
      entityId: id,
      detail: `Table ${table.name} deleted`,
    });

    await this.prisma.table.delete({ where: { id } });
    this.posGateway.emitEvent('table.deleted', id);
    return { success: true };
  }
}
