import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { PrismaClientService } from 'src/_prisma_client/prisma_client.service';
import { generatePassword } from 'src/_utils/number.gen';
import {
  hashPassword,
  PASSWORD_MIN_LENGTH,
  PASSWORD_TOO_SHORT_MESSAGE,
  verifyPassword,
} from 'src/_utils/password';
import { assertPanelPhoneFree } from 'src/_utils/panel-phone';

/**
 * The dashboard sends the Telegram id as `chatid` (the DTO name) while the
 * column is `chat_id`; Prisma rejects the unknown `chatid` key with a 500.
 */
function toAdminData<T extends { chatid?: string }>(data: T) {
  const { chatid, ...rest } = data;
  return {
    ...rest,
    ...(chatid !== undefined ? { chat_id: chatid } : {}),
  };
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaClientService) {}
  private logger = new Logger('Admin service');
  async create(data: CreateAdminDto) {
    this.logger.log('create');
    // Unique across admin/super/worker (the panel login checks all three).
    await assertPanelPhoneFree(this.prisma, data.phone);

    let shop = await this.prisma.shop.findUnique({
      where: {
        id: data.shop_id,
      },
    });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    // Store the password in plain text so the shop owner can read and share it
    // from the panel (see auth.service for the rationale).
    data.password = generatePassword({ length: PASSWORD_MIN_LENGTH });

    const admin = await this.prisma.admin.create({
      data: toAdminData(data),
    });
    return admin;
  }

  async findAll() {
    this.logger.log('findAll');
    const admins = await this.prisma.admin.findMany({
      include: { shop: true },
    });
    return admins;
  }
  /** The logged-in shop owner's own live profile (never the password). */
  async getMe(id: number) {
    this.logger.log('getMe');
    const admin = await this.prisma.admin.findUnique({
      where: { id },
      select: {
        id: true,
        fullname: true,
        phone: true,
        image: true,
        chat_id: true,
        shop_id: true,
        role: true,
      },
    });
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }
    return admin;
  }

  async findOne(id: number) {
    this.logger.log('findOne');
    if (!Number.isInteger(id) || id <= 0) {
      throw new NotFoundException('Admin not found');
    }
    let admin = await this.prisma.admin.findUnique({
      where: { id },
    });
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return admin;
  }

  async update(id: number, data: UpdateAdminDto) {
    this.logger.log('update');
    if (!Number.isInteger(id) || id <= 0) {
      throw new NotFoundException('Admin not found');
    }
    let admin = await this.prisma.admin.findUnique({
      where: { id },
    });
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    if (data.phone !== undefined && data.phone !== admin.phone) {
      await assertPanelPhoneFree(this.prisma, data.phone, {
        table: 'admin',
        id,
      });
    }

    // A password set by the platform admin must be one the login accepts.
    if (data.password !== undefined && data.password !== null) {
      if (
        typeof data.password !== 'string' ||
        data.password.length < PASSWORD_MIN_LENGTH
      ) {
        throw new BadRequestException(PASSWORD_TOO_SHORT_MESSAGE);
      }
    }

    if (data.shop_id !== undefined && data.shop_id !== admin.shop_id) {
      const shop = await this.prisma.shop.findUnique({
        where: { id: data.shop_id },
        select: { id: true },
      });
      if (!shop) {
        throw new NotFoundException('Shop not found');
      }
    }

    return await this.prisma.admin.update({
      where: { id },
      data: toAdminData(data),
    });
  }

  async updateMe(id: number, chat_id: string) {
    this.logger.log('updateMe');
    return await this.prisma.admin.update({
      where: { id },
      data: { chat_id },
      include: { shop: true },
    });
  }

  // A shop owner changing their OWN password. Passwords are stored in plain text
  // by design (see auth.service) so the value stays viewable/shareable from the
  // panel — keep it that way. verifyPassword accepts both plain text and a
  // bcrypt hash, so the old-password check works either way.
  async changeMyPassword(id: number, oldPassword: string, newPassword: string) {
    this.logger.log('changeMyPassword');
    if (!oldPassword || !newPassword) {
      throw new BadRequestException('Eski va yangi parol kiritilishi shart');
    }
    // Same minimum as the login (LoginDto): a shorter password could be saved
    // but never used to log in again.
    if (
      typeof newPassword !== 'string' ||
      newPassword.length < PASSWORD_MIN_LENGTH
    ) {
      throw new BadRequestException(PASSWORD_TOO_SHORT_MESSAGE);
    }
    const admin = await this.prisma.admin.findUnique({ where: { id } });
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }
    // verifyPassword returns { ok, needsUpgrade }; the object itself is always
    // truthy, so the old password must be checked via `ok`.
    const { ok } = await verifyPassword(oldPassword, admin.password);
    if (!ok) {
      throw new BadRequestException('Eski parol xato');
    }
    await this.prisma.admin.update({
      where: { id },
      data: { password: newPassword },
    });
    return { message: 'Parol yangilandi' };
  }

  async remove(id: number) {
    this.logger.log('remove');
    let admin = await this.prisma.admin.findUnique({
      where: { id },
    });
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return await this.prisma.admin.delete({
      where: { id },
    });
  }
}
