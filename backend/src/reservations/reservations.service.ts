import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { PosGateway } from '../events/pos.gateway';
import { ReservationStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ReservationsService {
  constructor(
    private prisma: PrismaService,
    private posGateway: PosGateway,
    private auditService: AuditService,
  ) {}

  async findAll() {
    return this.prisma.reservation.findMany({
      include: { table: true },
      orderBy: { time: 'asc' },
    });
  }

  async create(dto: CreateReservationDto) {
    const reservation = await this.prisma.reservation.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        guests: dto.guests,
        tableId: dto.tableId,
        time: new Date(dto.time),
        status: 'Confirmed',
      },
      include: { table: true },
    });
    this.posGateway.emitEvent('reservation.created', reservation);
    return reservation;
  }

  async update(id: string, dto: UpdateReservationDto) {
    const resExists = await this.prisma.reservation.findUnique({
      where: { id },
    });
    if (!resExists) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }

    const reservation = await this.prisma.reservation.update({
      where: { id },
      data: {
        status: dto.status as ReservationStatus,
      },
      include: { table: true },
    });

    if (dto.status === 'Completed' || dto.status === 'Seated' || dto.status === 'Cancelled') {
      await this.auditService.log({
        action: 'RESERVATION_STATUS_CHANGED',
        entity: 'Reservation',
        entityId: id,
        detail: `Reservation ${reservation.name} changed to ${dto.status}`,
      });
    }

    this.posGateway.emitEvent('reservation.updated', reservation);
    return reservation;
  }
}
