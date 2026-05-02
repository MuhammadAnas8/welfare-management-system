import { ApiProperty } from '@nestjs/swagger/dist/decorators/api-property.decorator';
import { IsString, IsUUID, IsEnum } from 'class-validator';

export class CreateUserRoleDto {
  @ApiProperty({ example: 'branch_id' })  
  @IsUUID()
  branch_id!: string;

  @ApiProperty({ example: 'branch_admin' })
  @IsEnum(['branch_admin', 'branch_editor', 'branch_viewer'])
  branch_role!: string;
}
