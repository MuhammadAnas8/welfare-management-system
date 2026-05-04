import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsUUID, Min, IsOptional } from 'class-validator';

export class CreateTransferDto {
  @ApiProperty({ example: 'branch-uuid' })
  @IsUUID()
  from_branch_id!: string;

  @ApiProperty({ example: 'head-office-uuid' })
  @IsUUID()
  to_branch_id!: string;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  @Min(0)
  amount_original!: number;

  @ApiProperty({ example: 'USD' })
  @IsString()
  @IsNotEmpty()
  currency_original!: string;

  @ApiProperty({ example: 280000, description: 'Estimated PKR value at time of submission' })
  @IsNumber()
  @Min(0)
  estimated_pkr!: number;

  @ApiPropertyOptional({ example: 'Monthly collection' })
  @IsString()
  @IsOptional()
  notes?: string;
}
