import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: 'Muhammad Ali' })
  @IsOptional()
  @IsString()
  full_name?: string;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty({ example: 'admin' })
  @IsOptional()
  @IsEnum(['super_admin', 'admin', 'editor', 'viewer'])
  global_role?: string;
}
