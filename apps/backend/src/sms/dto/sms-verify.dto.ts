import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class SmsVerifyDto {
  @ApiProperty({
    example: 'abc123',
    description: 'SMS yuborishda qaytarilgan ID',
  })
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty({
    example: '1234',
    description: 'SMS orqali kelgan OTP kod',
    minLength: 4,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(4)
  code: string;

  @ApiProperty({
    example: '123456789',
    description: 'Telegram chat_id (ixtiyoriy)',
    required: false,
  })
  @IsOptional()
  @IsString()
  chat_id?: string;

  @ApiProperty({
    example: 'uz',
    description: 'Foydalanuvchi tili: uz | ru (ixtiyoriy)',
    required: false,
  })
  @IsOptional()
  @IsString()
  lang?: string;
}
