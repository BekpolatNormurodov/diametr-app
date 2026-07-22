import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaClientService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
    console.log('PrismaClientService connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('PrismaClientService disconnected');
  }
}