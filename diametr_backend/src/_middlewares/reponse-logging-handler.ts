import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';

// ─── ANSI colour helpers ────────────────────────────────────────────────────
const c = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  cyan:    '\x1b[36m',
  red:     '\x1b[31m',
  magenta: '\x1b[35m',
  blue:    '\x1b[34m',
  white:   '\x1b[37m',
  gray:    '\x1b[90m',
};

function methodColor(method: string): string {
  switch (method) {
    case 'GET':    return c.cyan;
    case 'POST':   return c.green;
    case 'PUT':    return c.yellow;
    case 'PATCH':  return c.magenta;
    case 'DELETE': return c.red;
    default:       return c.white;
  }
}

function statusColor(status: number): string {
  if (status >= 500) return c.red;
  if (status >= 400) return c.yellow;
  if (status >= 300) return c.cyan;
  return c.green;
}

function ms(n: number): string {
  if (n < 100)  return `${c.green}${n}ms${c.reset}`;
  if (n < 500)  return `${c.yellow}${n}ms${c.reset}`;
  return `${c.red}${n}ms${c.reset}`;
}

// ────────────────────────────────────────────────────────────────────────────

@Injectable()
export class ResponseLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req    = context.switchToHttp().getRequest();
    const res    = context.switchToHttp().getResponse();
    const method = req.method as string;
    const url    = req.url   as string;
    const start  = Date.now();

    return next.handle().pipe(
      tap(() => {
        const delay  = Date.now() - start;
        const status = res.statusCode as number;
        const mc     = methodColor(method);
        const sc     = statusColor(status);

        this.logger.log(
          `${c.bold}${mc}${method.padEnd(7)}${c.reset} ` +
          `${c.white}${url}${c.reset}  ` +
          `${c.bold}${sc}${status}${c.reset}  ` +
          `${c.gray}▸${c.reset} ${ms(delay)}`,
        );
      }),
      catchError((err) => {
        const delay  = Date.now() - start;
        const status: number = err?.status ?? err?.statusCode ?? 500;
        const sc     = statusColor(status);
        const mc     = methodColor(method);

        this.logger.error(
          `${c.bold}${mc}${method.padEnd(7)}${c.reset} ` +
          `${c.white}${url}${c.reset}  ` +
          `${c.bold}${sc}${status}${c.reset}  ` +
          `${c.gray}▸${c.reset} ${ms(delay)}  ` +
          `${c.red}${err?.message ?? 'Unknown error'}${c.reset}`,
        );

        return throwError(() => err);
      }),
    );
  }
}
