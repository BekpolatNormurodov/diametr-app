import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login-dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login', description: 'Tizimga kirish (JWT token qaytaradi)' })
  @ApiResponse({ status: 200, description: 'Muvaffaqiyatli kirish - JWT token qaytariladi' })
  @ApiResponse({ status: 401, description: "Login yoki parol noto'g'ri" })
  async login(@Req() req: Request, @Body() data: LoginDto) {
    return await this.authService.login(data);
  }
}