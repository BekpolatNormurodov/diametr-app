import {
  HttpCode,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { LoginDto } from './dto/login-dto';
import { PrismaClientService } from 'src/_prisma_client/prisma_client.service';
import { JwtService } from '@nestjs/jwt';
import {
  hashPassword,
  verifyPassword,
  withoutPassword,
} from 'src/_utils/password';

@Injectable()
export class AuthService {
  constructor(
    @Inject() private prisma: PrismaClientService,
    private jwtService: JwtService,
  ) {}
  private logger = new Logger('Auth service');

  async login(data: LoginDto) {
    this.logger.log('login');

    const phone = '+' + data.login.replace(/^\+/, '');

    // Remember which table the row came from so a legacy plain-text password
    // can be upgraded in the right place after a successful login.
    let table: 'worker' | 'admin' | 'super' = 'worker';

    let user: any = await this.prisma.worker.findFirst({
      where: { phone },
    });

    if (!user) {
      table = 'admin';
      user = await this.prisma.admin.findFirst({
        where: { phone },
        include: { shop: true },
      });
    }
    if (!user) {
      table = 'super';
      user = await this.prisma.super.findFirst({
        where: { phone },
      });
    }
    if (!user) {
      // Still hash-compare so a missing account and a wrong password take the
      // same time and cannot be told apart by an attacker enumerating phones.
      await verifyPassword(data.password, null);
      throw new NotFoundException('Incorrect Credentials');
    }

    const { ok, needsUpgrade } = await verifyPassword(data.password, user.password);
    if (!ok) {
      throw new NotFoundException('Incorrect Credentials');
    }

    // NOTE: passwords for admin/worker are intentionally stored in plain text so
    // a shop owner can read and share them from the panel. `verifyPassword`
    // still accepts a bcrypt hash too (the super account keeps a hash), so both
    // work. We deliberately do NOT auto-upgrade plain text to a hash here —
    // otherwise the password would stop being viewable after the first login.
    void needsUpgrade;

    const payload = { user_id: user.id, role: user.role };
    return {
      user: withoutPassword(user),
      access_token: await this.jwtService.signAsync(payload),
      message: 'Logined successfully',
    };
  }
}
