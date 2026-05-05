import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, IsEnum } from 'class-validator';
import { CurrencyCode } from '../enums/currency.enum.js';

export class UpdateDonationDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  donor_name?: string;

  @ApiPropertyOptional({ example: '+923001234567' })
  @IsString()
  @IsOptional()
  donor_phone?: string;

  @ApiPropertyOptional({ example: 5000 })
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ enum: CurrencyCode, example: CurrencyCode.PKR })
  @IsOptional()
  @IsEnum(CurrencyCode)
  currency?: CurrencyCode;
}
