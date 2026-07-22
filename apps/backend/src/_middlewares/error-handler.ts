import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx      = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request  = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;

    const status: number = isHttp
      ? (exception as HttpException).getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const err: any = isHttp
      ? (exception as HttpException).getResponse()
      : { message: 'Internal Server Error' };

    const message: string =
      typeof err === 'string'
        ? err
        : Array.isArray(err?.message)
          ? err.message.join(', ')
          : err?.message ?? 'Unknown error';

    // ── Pretty log (no stack spam in console) ────────────────────────────
    if (status >= 500) {
      this.logger.error(
        `[${status}] ${request.method} ${request.url} — ${message}`,
        (exception as any)?.stack,
      );
    } else {
      this.logger.warn(
        `[${status}] ${request.method} ${request.url} — ${message}`,
      );
    }
    // ─────────────────────────────────────────────────────────────────────

    response.status(status).json({
      statusCode: status,
      message,
      ...(err?.error ? { error: err.error } : {}),
      path:      request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
