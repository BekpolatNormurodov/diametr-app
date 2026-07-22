import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaClientModule } from 'src/_prisma_client/prisma_client.module';

@Module({
  imports :[PrismaClientModule],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
