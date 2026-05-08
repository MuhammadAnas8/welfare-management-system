import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RejectExpenseDto {
  @ApiProperty({ example: 'Invalid documentation provided' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
