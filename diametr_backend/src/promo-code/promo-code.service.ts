import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DISCOUNT_TYPE, Prisma } from '@prisma/client';
import { PrismaClientService } from 'src/_prisma_client/prisma_client.service';
import {
  CreatePromoCodeDto,
  UpdatePromoCodeDto,
} from './dto/create-promo-code.dto';

const NOT_YOUR_PROMO = "Bu promokod sizning do'koningizga tegishli emas";
const PROMO_USED_DELETE =
  "Bu promokod buyurtmalarda ishlatilgan, uni o'chirib bo'lmaydi. Uning o'rniga nofaol qiling";
const PROMO_CODE_TAKEN = 'Bu promokod allaqachon mavjud';
const PERCENT_TOO_BIG = "Foizli chegirma 100% dan oshmasligi kerak";

@Injectable()
export class PromoCodeService {
  constructor(private readonly prisma: PrismaClientService) {}
  private logger = new Logger('PromoCodeService');

  /**
   * SUPER manages every code. A shop owner (ADMIN) only the codes of their own
   * shop — never another shop's code nor a platform-wide one (shop_id null).
   */
  private assertCanManage(promo: { shop_id: number | null }, req: any) {
    const role: string | undefined = req?.['role'] ?? req?.['user']?.role;
    if (role === 'SUPER') return;
    const shopId = req?.['user']?.shop_id;
    if (
      role === 'ADMIN' &&
      shopId != null &&
      promo.shop_id != null &&
      promo.shop_id === shopId
    ) {
      return;
    }
    throw new ForbiddenException(NOT_YOUR_PROMO);
  }

  private assertPercent(type: DISCOUNT_TYPE | undefined, value: unknown) {
    if (type === DISCOUNT_TYPE.PERCENT && Number(value) > 100) {
      throw new BadRequestException(PERCENT_TOO_BIG);
    }
  }

  /** A duplicate code is a 400 with a clear message, not a 500. */
  private rethrowUnique(e: unknown): never {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === 'P2002'
    ) {
      throw new BadRequestException(PROMO_CODE_TAKEN);
    }
    throw e;
  }

  async create(data: CreatePromoCodeDto) {
    this.logger.log('create');
    this.assertPercent(data.discount_type, data.discount_value);
    try {
      return await this.prisma.promoCode.create({
        data: {
          code: data.code,
          discount_type: data.discount_type,
          discount_value: data.discount_value,
          min_order_amount: data.min_order_amount ?? null,
          max_uses: data.max_uses ?? null,
          expires_at: data.expires_at ? new Date(data.expires_at) : null,
          shop_id: data.shop_id ?? null,
        },
      });
    } catch (e) {
      this.rethrowUnique(e);
    }
  }

  private async load(id: number, req: any) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new NotFoundException('Promo code not found');
    }
    const promo = await this.prisma.promoCode.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promo code not found');
    this.assertCanManage(promo, req);
    return promo;
  }

  async update(id: number, data: UpdatePromoCodeDto, req?: any) {
    this.logger.log('update');
    const promo = await this.load(id, req);
    this.assertPercent(
      data.discount_type ?? promo.discount_type,
      data.discount_value ?? promo.discount_value,
    );
    return this.prisma.promoCode.update({
      where: { id },
      data: {
        ...(data.code !== undefined && { code: data.code }),
        ...(data.discount_type !== undefined && {
          discount_type: data.discount_type,
        }),
        ...(data.discount_value !== undefined && {
          discount_value: data.discount_value,
        }),
        ...(data.min_order_amount !== undefined && {
          min_order_amount: data.min_order_amount,
        }),
        ...(data.max_uses !== undefined && { max_uses: data.max_uses }),
        ...(data.expires_at !== undefined && {
          expires_at: data.expires_at ? new Date(data.expires_at) : null,
        }),
        ...(data.is_active !== undefined && { is_active: data.is_active }),
      },
    }).catch((e) => this.rethrowUnique(e));
  }

  async findAll(shopId?: number) {
    this.logger.log('findAll');
    const items = await this.prisma.promoCode.findMany({
      where: shopId ? { shop_id: shopId } : {},
      include: { _count: { select: { uses: true } } },
      orderBy: { id: 'desc' },
    });
    return items.map(({ _count, ...item }) => ({
      ...item,
      used_count: _count.uses,
      discount_value: Number(item.discount_value),
      min_order_amount: item.min_order_amount
        ? Number(item.min_order_amount)
        : null,
    }));
  }

  async remove(id: number, req?: any) {
    this.logger.log('remove');
    await this.load(id, req);
    try {
      return await this.prisma.promoCode.delete({ where: { id } });
    } catch (e) {
      // Orders and promocodeuse rows reference a used code (FK RESTRICT).
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2003'
      ) {
        throw new BadRequestException(PROMO_USED_DELETE);
      }
      throw e;
    }
  }

  async toggle(id: number, req?: any) {
    this.logger.log('toggle');
    const promo = await this.load(id, req);
    return this.prisma.promoCode.update({
      where: { id },
      data: { is_active: !promo.is_active },
    });
  }

  /**
   * Validate a promo code for a given user.
   * Returns the promo code record or throws BadRequestException.
   */
  async validate(code: string, userId: number, shopId?: number) {
    this.logger.log(`validate: ${code} for user ${userId}`);

    const promo = await this.prisma.promoCode.findUnique({
      where: { code },
      include: {
        uses: { where: { user_id: userId } },
      },
    });

    if (!promo) {
      throw new BadRequestException('Promokod topilmadi');
    }

    if (promo.shop_id !== null && shopId && promo.shop_id !== shopId) {
      throw new BadRequestException("Bu promokod bu do'kon uchun emas");
    }

    if (!promo.is_active) {
      throw new BadRequestException('Promokod faol emas');
    }

    if (promo.expires_at && promo.expires_at < new Date()) {
      throw new BadRequestException('Promokod muddati tugagan');
    }

    if (promo.uses.length > 0) {
      throw new BadRequestException(
        'Bu promokod siz tomonidan allaqachon ishlatilgan',
      );
    }

    if (promo.max_uses !== null) {
      const totalUses = await this.prisma.promoCodeUse.count({
        where: { promo_code_id: promo.id },
      });
      if (totalUses >= promo.max_uses) {
        throw new BadRequestException('Promokod foydalanish limiti tugagan');
      }
    }

    return {
      id: promo.id,
      code: promo.code,
      discount_type: promo.discount_type,
      discount_value: Number(promo.discount_value),
      min_order_amount: promo.min_order_amount
        ? Number(promo.min_order_amount)
        : null,
      // Additive: the shop the code belongs to (null = every shop), so a
      // multi-shop cart can apply it to that shop's items.
      shop_id: promo.shop_id,
    };
  }
}
