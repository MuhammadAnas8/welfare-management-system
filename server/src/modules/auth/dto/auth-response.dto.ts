import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({ required: false })
  message?: string;

  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ required: false })
  name?: string;

  @ApiProperty({ required: false })
  accessToken?: string;

  @ApiProperty({ required: false })
  refreshToken?: string;

  @ApiProperty({ required: false })
  expiresAt?: number;
}
