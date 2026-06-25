import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PosGateway } from '../events/pos.gateway';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private posGateway: PosGateway,
  ) {}

  async findAll() {
    return this.prisma.product.findMany({
      where: { active: true },
      include: { category: true },
    });
  }

  async create(dto: CreateProductDto) {
    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        price: dto.price,
        categoryId: dto.categoryId,
        image: dto.image,
        desc: dto.desc,
        badge: dto.badge,
        outOfStock: dto.outOfStock ?? false,
        details: dto.details ?? {},
        standards: dto.standards ?? {},
        active: dto.active ?? true,
      },
      include: { category: true },
    });
    this.posGateway.emitEvent('product.created', product);
    return product;
  }

  async update(id: number, dto: UpdateProductDto) {
    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...dto,
        details: dto.details !== undefined ? dto.details : undefined,
        standards: dto.standards !== undefined ? dto.standards : undefined,
      },
      include: { category: true },
    });
    this.posGateway.emitEvent('product.updated', product);
    return product;
  }

  async remove(id: number) {
    await this.prisma.product.delete({ where: { id } });
    this.posGateway.emitEvent('product.deleted', id);
    return { success: true };
  }
}
