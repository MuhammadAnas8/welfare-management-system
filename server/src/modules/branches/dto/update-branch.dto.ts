import { PartialType } from '@nestjs/swagger';
import { CreateBranchDto } from './create-branch.dto.js';
import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBranchDto extends PartialType(CreateBranchDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
