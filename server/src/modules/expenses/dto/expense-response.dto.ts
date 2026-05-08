import { ApiProperty } from '@nestjs/swagger';
import { ExpenseStatus, FundSource } from '../enums/expense.enum.js';

export class ExpenseResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  expense_number!: string;

  @ApiProperty()
  branch_id!: string;

  @ApiProperty({ required: false })
  branch_name?: string;

  @ApiProperty()
  created_by!: string;

  @ApiProperty({ required: false })
  created_by_name?: string;

  @ApiProperty({ required: false })
  approved_by?: string;

  @ApiProperty({ required: false })
  approved_by_name?: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty()
  category!: string;

  @ApiProperty()
  amount!: number;

  @ApiProperty()
  currency!: string;

  @ApiProperty({ enum: FundSource })
  fund_source!: FundSource;

  @ApiProperty({ enum: ExpenseStatus })
  status!: ExpenseStatus;

  @ApiProperty()
  expense_date!: string;

  @ApiProperty({ nullable: true })
  approved_at!: string | null;

  @ApiProperty({ nullable: true })
  rejected_at!: string | null;

  @ApiProperty({ nullable: true })
  rejection_reason!: string | null;

  @ApiProperty()
  is_voided!: boolean;

  @ApiProperty({ nullable: true })
  void_reason!: string | null;

  @ApiProperty({ nullable: true })
  voided_at!: string | null;

  @ApiProperty()
  created_at!: string;

  @ApiProperty()
  updated_at!: string;
}
