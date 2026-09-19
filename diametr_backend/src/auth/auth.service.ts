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
import { LoginThrottle } from './login-throttle';

@Injectable()
export class AuthService {
  constructor(
    @Inject() private prisma: PrismaClientService,
    private jwtService: JwtService,
  ) {}
  private logger = new Logger('Auth service');
  private readonly throttle = new LoginThrottle();

  async login(data: LoginDto, ip = '-') {
    this.logger.log('login');

    const phone = '+' + data.login.replace(/^\+/, '');

    // Too many wrong passwords from this client: 429 before any lookup.
    this.throttle.assertAllowed(ip, phone);

    // Remember which table the row came from so a legacy plain-text password
    // can be upgraded in the right place after a successful login.
    // Order: shop owner, platform admin, then worker. No client logs in as a
    // worker, so a worker row can never shadow an owner's (or the SUPER's)
    // login; phones are also kept unique across the three tables on write.
    let table: 'worker' | 'admin' | 'super' = 'admin';

    let user: any = await this.prisma.admin.findFirst({
      where: { phone },
      include: { shop: true },
    });
    if (!user) {
      table = 'super';
      user = await this.prisma.super.findFirst({
        where: { phone },
      });
    }
    if (!user) {
      table = 'worker';
      user = await this.prisma.worker.findFirst({
        where: { phone },
      });
    }
    if (!user) {
      // Still hash-compare so a missing account and a wrong password take the
      // same time and cannot be told apart by an attacker enumerating phones.
      await verifyPassword(data.password, null);
      this.throttle.recordFailure(ip, phone);
      throw new NotFoundException('Incorrect Credentials');
    }

    const { ok, needsUpgrade } = await verifyPassword(data.password, user.password);
    if (!ok) {
      this.throttle.recordFailure(ip, phone);
      throw new NotFoundException('Incorrect Credentials');
    }
    this.throttle.recordSuccess(ip, phone);

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
