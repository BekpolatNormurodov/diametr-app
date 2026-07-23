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

    // Legacy plain-text row: rewrite it as a hash now that we know the password.
    // Failure here must not block the login.
    if (needsUpgrade) {
      try {
        const hashed = await hashPassword(data.password);
        const where = { id: user.id };
        const patch = { password: hashed };
        if (table === 'worker') {
          await this.prisma.worker.update({ where, data: patch });
        } else if (table === 'admin') {
          await this.prisma.admin.update({ where, data: patch });
        } else {
          await this.prisma.super.update({ where, data: patch });
        }
        this.logger.log(`upgraded ${table}#${user.id} password to bcrypt`);
      } catch (e) {
        this.logger.error(`password upgrade failed for ${table}#${user.id}`, e);
      }
    }

    const payload = { user_id: user.id, role: user.role };
    return {
      // Never send the stored password (or its hash) back to the client.
      user: withoutPassword(user),
      access_token: await this.jwtService.signAsync(payload),
      message: 'Logined successfully',
    };
  }
}
