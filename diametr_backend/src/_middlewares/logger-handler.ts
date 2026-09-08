import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

// ─── Winston API file transport ──────────────────────────────────────────────
// Writes one line per request: timestamp | ip | "METHOD /path" | status
// Each day → new file, yesterday's file is gzipped automatically.
const fileTransport = new (winston.transports as any).DailyRotateFile({
  filename: process.env.LOG_DIR
    ? `${process.env.LOG_DIR}/api-%DATE%.log`
    : '/app/logs/api-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,   // gzip yesterday's file
  maxSize: '50m',
  maxFiles: '30d',       // keep 30 days
  format: winston.format.printf((info) => info.message as string),
});

const apiLogger = winston.createLogger({
  transports: [
    fileTransport,
    // Also print to stdout so Docker logs / compose logs work
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf((info) => info.message as string),
      ),
    }),
  ],
});

// ─── Middleware ───────────────────────────────────────────────────────────────
@Injectable()
export class AppLoggerMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction): void {
    const { method, originalUrl } = request;

    // Prefer the real client IP forwarded by nginx
    const clientIp =
      (request.headers['x-real-ip'] as string) ||
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      request.ip ||
      '-';

    const start = Date.now();

    response.on('close', () => {
      const { statusCode } = response;
      const ms = Date.now() - start;
      const ts = new Date().toISOString();

      // Format: 2025-01-01T00:00:00.000Z | 1.2.3.4 | "GET /api/v1/products" | 200 | 42ms
      apiLogger.info(
        `${ts} | ${clientIp} | "${method} ${originalUrl}" | ${statusCode} | ${ms}ms`,
      );
    });

    next();
  }
}