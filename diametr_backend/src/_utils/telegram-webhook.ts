import { Logger } from '@nestjs/common';
import { createHash, timingSafeEqual } from 'crypto';

const logger = new Logger('TelegramWebhook');
/** Telegram accepts 1-256 characters of A-Z, a-z, 0-9, _ and -. */
const VALID_SECRET = /^[A-Za-z0-9_-]{1,256}$/;

/**
 * The `secret_token` registered with setWebhook. Telegram then sends it in the
 * `X-Telegram-Bot-Api-Secret-Token` header of every update, which is how the
 * webhook routes tell real updates from forged ones.
 *
 * TELEGRAM_WEBHOOK_SECRET overrides it; otherwise it is derived from the bot
 * token (sha256 hex): no new credential, and the same value on every replica.
 * Empty when there is no bot token (no webhook to protect).
 */
export function telegramWebhookSecret(botToken: string): string {
  const override = (process.env.TELEGRAM_WEBHOOK_SECRET ?? '').trim();
  if (override) {
    if (VALID_SECRET.test(override)) return override;
    logger.warn(
      'TELEGRAM_WEBHOOK_SECRET has characters Telegram does not accept; using the derived secret',
    );
  }
  if (!botToken) return '';
  return createHash('sha256').update(botToken).digest('hex');
}

/** Constant-time check of the header Telegram sent against the expected secret. */
export function isTelegramWebhookSecretValid(
  expected: string,
  received: string | string[] | undefined,
): boolean {
  const value = Array.isArray(received) ? received[0] : received;
  if (!expected || typeof value !== 'string' || value.length === 0) {
    return false;
  }
  const a = Buffer.from(expected);
  const b = Buffer.from(value);
  return a.length === b.length && timingSafeEqual(a, b);
}
