import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  IsUUID,
  Min,
  IsDateString,
} from 'class-validator';
import { FundSource } from '../enums/expense.enum.js';

export class CreateExpenseDto {
  @ApiProperty({ example: 'branch-uuid' })
  @IsUUID()
  @IsNotEmpty()
  branch_id!: string;

  @ApiProperty({ example: 'Office Supplies' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ example: 'Paper and ink' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Utilities' })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiProperty({ example: 1500.5 })
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiProperty({ example: 'PKR' })
  @IsString()
  @IsNotEmpty()
  currency!: string;

  @ApiProperty({ enum: FundSource, example: FundSource.LOCAL })
  @IsEnum(FundSource)
  fund_source!: FundSource;

  @ApiPropertyOptional({ example: '2026-05-09' })
  @IsDateString()
  @IsOptional()
  expense_date?: string;
}
