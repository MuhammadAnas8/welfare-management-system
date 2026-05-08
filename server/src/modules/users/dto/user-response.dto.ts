import { ApiProperty } from '@nestjs/swagger';

export class UserBranchRoleResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  branch_id!: string;

  @ApiProperty({ required: false })
  branch_name?: string;

  @ApiProperty()
  branch_role!: string;

  @ApiProperty()
  assigned_at!: Date;
}

export class UserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ nullable: true })
  full_name!: string | null;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  global_role!: string;

  @ApiProperty()
  is_active!: boolean;

  @ApiProperty()
  created_at!: Date;

  @ApiProperty({ type: [UserBranchRoleResponseDto] })
  branches!: UserBranchRoleResponseDto[];
}
