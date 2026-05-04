import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class VoidDonationDto {
  @ApiProperty({ example: 'Entered incorrect amount' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
