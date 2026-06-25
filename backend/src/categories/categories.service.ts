import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PosGateway } from '../events/pos.gateway';

@Injectable()
export class CategoriesService {
  constructor(
    private prisma: PrismaService,
    private posGateway: PosGateway,
  ) {}

  async findAll() {
    return this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async create(dto: CreateCategoryDto) {
    const category = await this.prisma.category.create({
      data: {
        name: dto.name,
        sortOrder: dto.sortOrder,
      },
    });
    this.posGateway.emitEvent('category.created', category);
    return category;
  }

  async update(id: number, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.update({
      where: { id },
      data: dto,
    });
    this.posGateway.emitEvent('category.updated', category);
    return category;
  }

  async remove(id: number) {
    await this.prisma.category.delete({ where: { id } });
    this.posGateway.emitEvent('category.deleted', id);
    return { success: true };
  }
}
