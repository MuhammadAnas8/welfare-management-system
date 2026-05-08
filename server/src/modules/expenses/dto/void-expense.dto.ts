import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class VoidExpenseDto {
  @ApiProperty({ example: 'Mistake in amount' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
