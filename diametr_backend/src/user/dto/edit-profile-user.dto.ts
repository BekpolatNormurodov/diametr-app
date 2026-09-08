import { ApiProperty } from '@nestjs/swagger';
import { DATE_TYPE } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  isNumber,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
  Matches,
  Min,
  MinLength,
} from 'class-validator';
import { addHours, parse } from 'date-fns';

export class editProfileUserDto {
  @ApiProperty({ example: 'Alisher Umarov', description: 'To‘liq ism', minLength: 4 })
  @IsNotEmpty()
  @IsString()
  @MinLength(4)
  fullname: string;
}
