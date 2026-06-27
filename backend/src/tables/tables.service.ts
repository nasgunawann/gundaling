import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { PosGateway } from '../events/pos.gateway';
import { TableStatus } from '@prisma/client';

@Injectable()
export class TablesService {
  constructor(
    private prisma: PrismaService,
    private posGateway: PosGateway,
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

    const data: { posX?: number; posY?: number; status?: TableStatus } = {};
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
    await this.prisma.table.delete({ where: { id } });
    this.posGateway.emitEvent('table.deleted', id);
    return { success: true };
  }
}
