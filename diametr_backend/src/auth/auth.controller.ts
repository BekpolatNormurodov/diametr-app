import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login-dto';
import { clientIp } from './login-throttle';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login', description: 'Tizimga kirish (JWT token qaytaradi)' })
  @ApiResponse({ status: 200, description: 'Muvaffaqiyatli kirish - JWT token qaytariladi' })
  @ApiResponse({ status: 401, description: "Login yoki parol noto'g'ri" })
  @ApiResponse({ status: 429, description: "Juda ko'p noto'g'ri urinish" })
  async login(@Req() req: any, @Body() data: LoginDto) {
    return await this.authService.login(data, clientIp(req));
  }
}