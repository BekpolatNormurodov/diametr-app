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

export class CreateCategoryDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  name_uz: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  name_ru: string;

  @IsOptional()
  @IsString()
  desc: string;

  @IsOptional()
  @IsString()
  image: string;
}
