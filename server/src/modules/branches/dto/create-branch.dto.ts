import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateBranchDto {
  @ApiProperty({ example: 'Main Branch' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Pakistan', default: 'Pakistan' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ example: 'PKR', default: 'PKR' })
  @IsString()
  @IsOptional()
  currency_code?: string;

  @ApiPropertyOptional({ example: 'Central operations branch' })
  @IsString()
  @IsOptional()
  description?: string;
}
