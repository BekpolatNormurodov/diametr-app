import { IsOptional, IsString, MinLength } from 'class-validator';

/**
 * Admin-side edit of a user (from the dashboard). Both fields are optional so
 * the admin can change just the name, just the phone, or both.
 */
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullname?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
