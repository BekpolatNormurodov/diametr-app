import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: '+998901234567', description: 'Login (telefon raqam)', minLength: 12 })
  @IsNotEmpty()
  @IsString()
  @MinLength(12)
  login: string;

  @ApiProperty({ example: 'P@ssword1', description: 'Parol', minLength: 8 })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;
}