import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Muhammad Ali' })
  @IsOptional()
  @IsString()
  full_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ example: 'admin' })
  @IsOptional()
  @IsEnum(['super_admin', 'admin', 'editor', 'viewer'])
  global_role?: string;
}
