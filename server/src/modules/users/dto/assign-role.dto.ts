import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsEnum } from 'class-validator';
import { BranchRole } from '../enums/roles.enum';

export class AssignUserRoleDto {
  @ApiProperty({ example: 'user-uuid', description: 'The UUID of the user' })
  @IsUUID()
  user_id!: string;

  @ApiProperty({ example: 'branch-uuid', description: 'The UUID of the branch' })
  @IsUUID()
  branch_id!: string;

  @ApiProperty({ enum: BranchRole, example: BranchRole.ADMIN, description: 'The role to assign in the branch' })
  @IsEnum(BranchRole)
  branch_role!: BranchRole;
}
