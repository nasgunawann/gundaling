import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPinDto } from './dto/reset-pin.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        employeeId: true,
        name: true,
        role: true,
        email: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async create(dto: CreateUserDto) {
    const existingEmployee = await this.prisma.user.findUnique({
      where: { employeeId: dto.employeeId },
    });
    if (existingEmployee) {
      throw new BadRequestException('Employee ID is already registered.');
    }

    const cleanName = dto.name.toLowerCase().replace(/\s+/g, '');
    const generatedEmail = `${cleanName}@gundaling.local`;

    const existingEmail = await this.prisma.user.findUnique({
      where: { email: generatedEmail },
    });
    if (existingEmail) {
      throw new BadRequestException('Generated email collision. Try a slightly different name.');
    }

    const pinHash = await bcrypt.hash(dto.pin, 10);
    const passwordHash = await bcrypt.hash('gundaling123', 10);

    return this.prisma.user.create({
      data: {
        name: dto.name,
        employeeId: dto.employeeId,
        role: dto.role,
        pinHash,
        email: generatedEmail,
        password: passwordHash,
      },
      select: {
        id: true,
        employeeId: true,
        name: true,
        role: true,
        email: true,
      },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (dto.employeeId && dto.employeeId !== user.employeeId) {
      const existingEmployee = await this.prisma.user.findUnique({
        where: { employeeId: dto.employeeId },
      });
      if (existingEmployee) {
        throw new BadRequestException('Employee ID is already registered.');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
        employeeId: dto.employeeId,
        role: dto.role,
      },
      select: {
        id: true,
        employeeId: true,
        name: true,
        role: true,
        email: true,
      },
    });
  }

  async resetPin(id: string, dto: ResetPinDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const pinHash = await bcrypt.hash(dto.pin, 10);
    await this.prisma.user.update({
      where: { id },
      data: { pinHash },
    });

    return { success: true };
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }
}
