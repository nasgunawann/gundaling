import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { Role } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private auditService: AuditService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { employeeId: loginDto.employeeId },
    });
    if (!user) {
      this.auditService.log({
        action: 'LOGIN_FAILED',
        entity: 'User',
        detail: `Employee ID ${loginDto.employeeId} not found`,
      }).catch(() => {});
      throw new UnauthorizedException('User not found or PIN is incorrect');
    }
    const isPinValid = await bcrypt.compare(loginDto.pin, user.pinHash);
    if (!isPinValid) {
      this.auditService.log({
        action: 'LOGIN_FAILED',
        entity: 'User',
        entityId: user.id,
        detail: `Invalid PIN for employee ID ${loginDto.employeeId}`,
      }).catch(() => {});
      throw new UnauthorizedException('User not found or PIN is incorrect');
    }

    const payload = { sub: user.id, username: user.name, role: user.role };
    const token = await this.jwtService.signAsync(payload);

    this.auditService.log({
      action: 'LOGIN_SUCCESS',
      entity: 'User',
      entityId: user.id,
      detail: `${user.name} (${user.role}) logged in`,
    }).catch(() => {});

    return {
      user: {
        id: user.id,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  async validateUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        role: true,
      },
    });
  }

  async verifyManagerPin(pin: string): Promise<boolean> {
    const managers = await this.prisma.user.findMany({
      where: { role: Role.Manager },
    });
    for (const manager of managers) {
      const isPinValid = await bcrypt.compare(pin, manager.pinHash);
      if (isPinValid) {
        this.auditService.log({
          action: 'MANAGER_PIN_VERIFIED',
          entity: 'User',
          entityId: manager.id,
          detail: `Manager PIN verified for ${manager.name}`,
        }).catch(() => {});
        return true;
      }
    }
    this.auditService.log({
      action: 'MANAGER_PIN_FAILED',
      entity: 'User',
      detail: 'Invalid manager PIN attempt',
    }).catch(() => {});
    return false;
  }
}
