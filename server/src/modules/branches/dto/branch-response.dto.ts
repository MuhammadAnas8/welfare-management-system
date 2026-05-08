import { ApiProperty } from '@nestjs/swagger';

export class BranchResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  country!: string;

  @ApiProperty()
  currency_code!: string;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty()
  is_active!: boolean;

  @ApiProperty({ required: false })
  created_by?: string;

  @ApiProperty({ required: false })
  created_by_name?: string;

  @ApiProperty()
  created_at!: Date;

  @ApiProperty()
  updated_at!: Date;
}
