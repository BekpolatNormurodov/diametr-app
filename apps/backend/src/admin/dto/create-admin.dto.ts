import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
  Min,
  MinLength,
} from 'class-validator';

export class CreateAdminDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(4)
  fullname: string;

  @IsNotEmpty()
  @IsString()
  @IsPhoneNumber('UZ')
  @Length(13)
  phone: string;

  @IsOptional()
  password: string;

  @IsOptional()
  chatid: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  shop_id: number;
}
