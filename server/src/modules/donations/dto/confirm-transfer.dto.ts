import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class ConfirmTransferDto {
  @ApiProperty({ example: 279500, description: 'Actual PKR amount received by Head Office' })
  @IsNumber()
  @Min(0)
  received_pkr!: number;
}
