import { ApiProperty } from '@nestjs/swagger';

export class MeResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  full_name!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  global_role!: string;

  @ApiProperty({ type: [Object] })
  branches!: any[];
}