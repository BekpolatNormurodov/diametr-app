import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PrismaClientService } from 'src/_prisma_client/prisma_client.service';
import { generatePassword } from 'src/_utils/number.gen';
import { assertPanelPhoneFree } from 'src/_utils/panel-phone';
import {
  hashPassword,
  withoutPassword,
  WORKER_PUBLIC_SELECT,
} from 'src/_utils/password';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';

@Injectable()
export class WorkerService {
  constructor(private readonly prisma: PrismaClientService) {}
  private logger = new Logger('Worker service');
  async create(data: CreateWorkerDto) {
    this.logger.log('create');
    // Unique across admin/super/worker: a worker row with a shop owner's phone
    // would otherwise take over that owner's panel login.
    await assertPanelPhoneFree(this.prisma, data.phone);

    let service = await this.prisma.service.findUnique({
      where: {
        id: data.service_id,
      },
    });

    if (!service) {
      throw new NotFoundException('service not found');
    }

    // Store the password in plain text so the shop owner can read and share it
    // from the panel (see auth.service for the rationale).
    data.password = generatePassword({ length: 8 });

    const worker = await this.prisma.worker.create({
      data: data,
    });
    return worker;
  }

  async findAll() {
    this.logger.log('findAll');
    // Public route (mobile + panels): never expose passwords.
    const workers = await this.prisma.worker.findMany({
      orderBy: { id: 'desc' },
      select: WORKER_PUBLIC_SELECT,
    });
    return workers;
  }
  async findOne(id: number) {
    this.logger.log('findOne');
    let worker = await this.prisma.worker.findUnique({
      where: { id },
      select: WORKER_PUBLIC_SELECT,
    });
    if (!worker) {
      throw new NotFoundException('worker not found');
    }

    return worker;
  }

  async update(id: number, data: UpdateWorkerDto) {
    this.logger.log('update');
    if (!Number.isInteger(id) || id <= 0) {
      throw new NotFoundException('worker not found');
    }
    let worker = await this.prisma.worker.findUnique({
      where: { id },
    });
    if (!worker) {
      throw new NotFoundException('worker not found');
    }
    if (data.phone !== undefined && data.phone !== worker.phone) {
      await assertPanelPhoneFree(this.prisma, data.phone, {
        table: 'worker',
        id,
      });
    }
    if (data.service_id) {
      let service = await this.prisma.service.findUnique({
        where: {
          id: data.service_id,
        },
      });
      if (!service) {
        throw new NotFoundException('service not found');
      }
    }

    return withoutPassword(
      await this.prisma.worker.update({
        where: { id },
        data,
      }),
    );
  }

  async remove(id: number) {
    this.logger.log('remove');
    let worker = await this.prisma.worker.findUnique({
      where: { id },
    });
    if (!worker) {
      throw new NotFoundException('worker not found');
    }

    return withoutPassword(
      await this.prisma.worker.delete({
        where: { id },
      }),
    );
  }
}
