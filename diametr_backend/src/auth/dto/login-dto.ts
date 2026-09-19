import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { PASSWORD_MIN_LENGTH } from 'src/_utils/password';

export class LoginDto {
  @ApiProperty({ example: '+998901234567', description: 'Login (telefon raqam)', minLength: 12 })
  @IsNotEmpty()
  @IsString()
  @MinLength(12)
  login: string;

  @ApiProperty({ example: 'P@ssword1', description: 'Parol', minLength: PASSWORD_MIN_LENGTH })
  @IsNotEmpty()
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  password: string;
}