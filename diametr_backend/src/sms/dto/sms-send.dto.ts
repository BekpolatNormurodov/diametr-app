import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsPhoneNumber, IsString, Length } from 'class-validator';

export class SmsSendDto {
  @ApiProperty({
    example: '+998901234567',
    description: 'UZ formatidagi telefon raqam',
  })
  @IsNotEmpty()
  @IsString()
  @IsPhoneNumber('UZ')
  @Length(13)
  phone: string;
}
