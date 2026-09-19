import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';
import { editProfileUserDto } from './dto/edit-profile-user.dto';
import { PrismaClientService } from 'src/_prisma_client/prisma_client.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaClientService) {}
  private logger = new Logger('User service');
  async editProfile(req: Request, data: editProfileUserDto) {
    this.logger.log('edit-profile');
    let user = req['user'];

    return await this.prisma.user.update({
      where: { id: user.id },
      data,
    });
  }

  /** A non-numeric / non-positive id can never exist (and would 500 in Prisma). */
  private assertId(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new NotFoundException('user not found');
    }
  }

  async update(id: number, data: any) {
    this.logger.log('update');
    this.assertId(id);
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('user not found');
    }
    // If the phone changes, make sure it is not already taken by someone else.
    if (data.phone && data.phone !== user.phone) {
      const clash = await this.prisma.user.findFirst({ where: { phone: data.phone } });
      if (clash && clash.id !== id) {
        throw new BadRequestException('This phone is used');
      }
    }
    return await this.prisma.user.update({ where: { id }, data });
  }

  async findAll() {
    this.logger.log('findAll');
    const users = await this.prisma.user.findMany({
      orderBy: { id: 'desc' },
    });
    return users;
  }
  async findOne(id: number) {
    this.logger.log('findOne');
    this.assertId(id);
    let user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException('user not found');
    }

    return user;
  }

  async remove(id: number) {
    this.logger.log('remove');
    this.assertId(id);
    let user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException('user not found');
    }

    try {
      return await this.prisma.user.delete({
        where: { id },
      });
    } catch (e) {
      // promocodeuse keeps the promo-code history and may not lose its user
      // (FK RESTRICT). Say so instead of a 500.
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2003'
      ) {
        throw new BadRequestException(
          "Foydalanuvchini o'chirib bo'lmaydi: u promo kod ishlatgan",
        );
      }
      throw e;
    }
  }
}
