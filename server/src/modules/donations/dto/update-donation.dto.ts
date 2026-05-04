import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

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

  @ApiPropertyOptional({ example: 'PKR' })
  @IsString()
  @IsOptional()
  currency?: string;
}
