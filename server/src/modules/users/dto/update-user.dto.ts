import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { GlobalRole } from '../enums/roles.enum';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Muhammad Ali', description: 'Full name of the user' })
  @IsOptional()
  @IsString()
  full_name?: string;

  @ApiPropertyOptional({ description: 'Status of the user' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ enum: GlobalRole, example: GlobalRole.ADMIN, description: 'Global system role' })
  @IsOptional()
  @IsEnum(GlobalRole)
  global_role?: GlobalRole;
}
