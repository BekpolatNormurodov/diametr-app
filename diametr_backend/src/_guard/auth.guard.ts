import {
    BadRequestException,
    CanActivate,
    ExecutionContext,
    Inject,
    Injectable,
    NotFoundException,
    UnauthorizedException,
  } from '@nestjs/common';
  import { JwtService } from '@nestjs/jwt';
  
  import { Request } from 'express';
  import { Role } from '@prisma/client';
import { PrismaClientService } from 'src/_prisma_client/prisma_client.service';
  
  @Injectable()
  export class AuthGuard implements CanActivate {
    constructor(
      private jwtService: JwtService,
      @Inject() private prismaService: PrismaClientService,
    ) {}
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const token = this.extractTokenFromHeader(request);
      if (!token) {
        throw new UnauthorizedException();
      }
  
      let payload: {
        role: Role,
        user_id: number
      };
      try {
        payload = await this.jwtService.verifyAsync(token);
      } catch (e) {
        throw new UnauthorizedException();
      }
     let where  = {   id: payload.user_id}
      let user: any;
      if (payload.role == Role.USER) {
        user = await this.prismaService.user.findUnique({
          where
        });
      } else if (payload.role == Role.WORKER) {
        user = await this.prismaService.worker.findUnique({
          where
        });
      } else if (payload.role == Role.ADMIN) {
        user = await this.prismaService.admin.findUnique({
          where
        });
      } 
       else if (payload.role == Role.SUPER) {
        user = await this.prismaService.super.findUnique({
          where
        });
      } 
  
      if (!user) {
        throw new UnauthorizedException();
      }
     
  
      request['user'] = user;
  
      return true;
    }
  
    private extractTokenFromHeader(request: Request): string | undefined {
      const [type, token] = request.headers.authorization?.split(' ') ?? [];
      return type === 'Bearer' ? token : undefined;
    }
  }