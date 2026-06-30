import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    action: string;
    entity: string;
    entityId?: string;
    userId?: string;
    detail?: string;
  }) {
    await this.prisma.auditLog.create({
      data: {
        action: params.action,
        entity: params.entity,
        entityId: params.entityId ?? null,
        userId: params.userId ?? null,
        detail: params.detail ?? null,
      },
    });
  }
}
