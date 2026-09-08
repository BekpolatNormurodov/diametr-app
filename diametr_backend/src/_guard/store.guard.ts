import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

/**
 * Requires JWT to have been issued by the Store Bot.
 * Tokens from mobile/web login do NOT have source:'STORE_BOT'
 * and will be rejected with 403.
 */
@Injectable()
export class StoreGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.headers.authorization?.split(' ')[1];
    if (!token) throw new UnauthorizedException('Store token required');

    let payload: { source?: string };
    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    if (payload.source !== 'STORE_BOT') {
      throw new ForbiddenException('Bu sahifaga faqat Telegram bot orqali kirish mumkin.');
    }
    return true;
  }
}
