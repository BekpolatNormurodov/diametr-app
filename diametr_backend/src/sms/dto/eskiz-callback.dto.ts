import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * Eskiz delivery report callback payload.
 * Eskiz form-data yoki json yuborishi mumkin — barcha maydonlar string.
 */
export class EskizCallbackDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  message_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  user_sms_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  request_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sms_count?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  status_date?: string;

  @ApiProperty({
    required: false,
    description:
      'waiting | TRANSMITTED | DELIVIVERED | REJECTED | EXPIRED | UNDELIV',
  })
  @IsOptional()
  @IsString()
  status?: string;
}
