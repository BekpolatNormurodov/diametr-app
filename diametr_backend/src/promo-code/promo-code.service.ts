import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientService } from 'src/_prisma_client/prisma_client.service';
import {
  CreatePromoCodeDto,
  UpdatePromoCodeDto,
} from './dto/create-promo-code.dto';

@Injectable()
export class PromoCodeService {
  constructor(private readonly prisma: PrismaClientService) {}
  private logger = new Logger('PromoCodeService');

  async create(data: CreatePromoCodeDto) {
    this.logger.log('create');
    return this.prisma.promoCode.create({
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
  }

  async update(id: number, data: UpdatePromoCodeDto) {
    this.logger.log('update');
    const promo = await this.prisma.promoCode.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promo code not found');
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
    });
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

  async remove(id: number) {
    this.logger.log('remove');
    const promo = await this.prisma.promoCode.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promo code not found');
    return this.prisma.promoCode.delete({ where: { id } });
  }

  async toggle(id: number) {
    this.logger.log('toggle');
    const promo = await this.prisma.promoCode.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promo code not found');
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
    };
  }
}
