import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsUUID, IsOptional, Min } from 'class-validator';

export class CreateDonationDto {
  @ApiProperty({ example: 'branch-uuid' })
  @IsUUID()
  branch_id!: string;

  @ApiProperty({ example: 'Muhammad Ali' })
  @IsString()
  @IsNotEmpty()
  donor_name!: string;

  @ApiPropertyOptional({ example: '+923001234567' })
  @IsString()
  @IsOptional()
  donor_phone?: string;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({ example: 'PKR', description: 'Currency code (e.g., PKR, USD, GBP)' })
  @IsString()
  @IsNotEmpty()
  currency!: string;
}
