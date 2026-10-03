import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

/** One day of the weekly schedule; null = day off. "24:00" closes at midnight. */
export type WorkDay = { open: string; close: string } | null;

const TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const CLOSE_TIME = /^(?:(?:[01]\d|2[0-3]):[0-5]\d|24:00)$/;
export const SHOP_DESCRIPTION_MAX = 3000;

/**
 * Validates the weekly hours (Monday first, 7 entries). A close time earlier
 * than the open time means the shop works past midnight. All days off counts
 * as "not set".
 */
export function normalizeWorkHours(value: unknown): WorkDay[] | null {
  if (value == null) return null;
  if (!Array.isArray(value) || value.length !== 7) {
    throw new BadRequestException('Invalid work hours');
  }
  const days = value.map((d): WorkDay => {
    if (d == null) return null;
    if (typeof d !== 'object') throw new BadRequestException('Invalid work hours');
    const open = String((d as any).open ?? '');
    const close = String((d as any).close ?? '');
    if (!TIME.test(open) || !CLOSE_TIME.test(close) || open === close) {
      throw new BadRequestException('Invalid work hours');
    }
    return { open, close };
  });
  return days.some(Boolean) ? days : null;
}

const cleanText = (v: string | null | undefined) => {
  if (v === undefined) return undefined;
  const s = (v ?? '').replace(/\r\n/g, '\n').trim();
  return s ? s.slice(0, SHOP_DESCRIPTION_MAX) : null;
};

/** Fits both the checked and unchecked Prisma create/update inputs. */
export type ShopInfoData = {
  description?: string | null;
  description_ru?: string | null;
  work_hours?: Prisma.InputJsonValue | Prisma.NullTypes.DbNull;
};

/** Prisma data for the info fields that were sent (absent fields stay untouched). */
export function shopInfoData(data: {
  description?: string | null;
  description_ru?: string | null;
  work_hours?: unknown;
}): ShopInfoData {
  const out: ShopInfoData = {};
  const uz = cleanText(data.description);
  const ru = cleanText(data.description_ru);
  if (uz !== undefined) out.description = uz;
  if (ru !== undefined) out.description_ru = ru;
  if (data.work_hours !== undefined) {
    const hours = normalizeWorkHours(data.work_hours);
    out.work_hours = hours ? (hours as Prisma.InputJsonValue) : Prisma.DbNull;
  }
  return out;
}
