import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  resolveLang,
  translateHttpMessage,
  validationMessage,
} from '../_i18n/i18n';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Language: from `accept-language`, defaulting to Uzbek.
    const lang = resolveLang(request.headers['accept-language'] as string);

    const isHttp = exception instanceof HttpException;

    const status: number = isHttp
      ? (exception as HttpException).getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const err: any = isHttp
      ? (exception as HttpException).getResponse()
      : { message: 'Internal Server Error' };

    // Raw English message — kept only for the server log.
    const rawMessage: string =
      typeof err === 'string'
        ? err
        : Array.isArray(err?.message)
          ? err.message.join(', ')
          : err?.message ?? 'Unknown error';

    // ── Build the localized, human-readable message ──────────────────────
    let message: string;
    if (err && Array.isArray(err.validation)) {
      // Structured validation failures from the ValidationPipe factory.
      message = err.validation
        .map((v: { field: string; constraint: string; args: string[] }) =>
          validationMessage(v.field, v.constraint, v.args ?? [], lang),
        )
        .join('. ');
    } else if (typeof err === 'string') {
      message = translateHttpMessage(err, lang);
    } else if (Array.isArray(err?.message)) {
      // Fallback: plain class-validator strings (rare now, but safe).
      message = err.message
        .map((m: string) => translateHttpMessage(m, lang))
        .join('. ');
    } else {
      message = translateHttpMessage(rawMessage, lang);
    }

    // ── Log (raw English, no stack spam) ─────────────────────────────────
    if (status >= 500) {
      this.logger.error(
        `[${status}] ${request.method} ${request.url} — ${rawMessage}`,
        (exception as any)?.stack,
      );
    } else {
      this.logger.warn(
        `[${status}] ${request.method} ${request.url} — ${rawMessage}`,
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      ...(err?.error ? { error: err.error } : {}),
      lang,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
