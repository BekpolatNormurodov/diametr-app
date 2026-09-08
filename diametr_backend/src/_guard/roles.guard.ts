import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { PrismaClientService } from 'src/_prisma_client/prisma_client.service';
import { Request } from 'express';

export function RolesGuardFactory(roles: Role[]): any {
  @Injectable()
  class DynamicRolesGuard implements CanActivate {
    constructor(
      private jwtService: JwtService,
      private prisma: PrismaClientService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest<Request>();
      const token = request.headers.authorization?.split(' ')[1];
      if (!token) throw new UnauthorizedException();

      let payload: { role: Role; user_id: number; source?: string };
      try {
        payload = await this.jwtService.verifyAsync(token);
      } catch (e) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      const isAllowed = roles.includes(payload.role);
      if (!isAllowed) throw new UnauthorizedException('Access denied');

      const user = await this.prisma[payload.role.toLowerCase()].findUnique({
        where: { id: payload.user_id },
      });

      if (!user) throw new UnauthorizedException(`${payload.role.toLowerCase()} not found`);

      request['user'] = user;
      // Expose JWT source so controllers can use it (e.g. ORDER_SOURCE derivation)
      if (payload.source) request['tokenSource'] = payload.source;
      return true;
    }
  }

  return DynamicRolesGuard;
}
