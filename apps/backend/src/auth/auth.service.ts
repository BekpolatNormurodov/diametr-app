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

    let user: any = await this.prisma.worker.findFirst({
      where: { phone },
    });

    if (!user) {
      user = await this.prisma.admin.findFirst({
        where: { phone },
        include: { shop: true },
      });
    }
    if (!user) {
      user = await this.prisma.super.findFirst({
        where: { phone },
      });
    }
    if (!user || user.password !== data.password) {
      throw new NotFoundException('Incorrect Credentials');
    }

    const payload = { user_id: user.id, role: user.role };
    return {
      user,
      access_token: await this.jwtService.signAsync(payload),
      message: 'Logined successfully',
    };
  }
}
