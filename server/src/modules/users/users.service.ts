import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { AssignUserRoleDto } from './dto/assign-role.dto.js';
import { User } from './interfaces/user.interface.js';
import { GlobalRole, BranchRole } from './enums/roles.enum.js';
import { AuditService } from '../../common/audit/audit.service.js';
import { PermissionService } from '../../common/permissions/permission.service.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { UserResponseDto } from './dto/user-response.dto.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly auditService: AuditService,
    private readonly permissionService: PermissionService,
  ) {}

  private mapUser(u: any): UserResponseDto {
    return {
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      global_role: u.global_role,
      is_active: u.is_active,
      created_at: u.created_at,
      branches: (u.user_branch_roles || []).map((ubr: any) => ({
        id: ubr.id,
        branch_id: ubr.branch_id,
        branch_name: ubr.branches?.name || ubr.branch?.name,
        branch_role: ubr.branch_role,
        assigned_at: ubr.assigned_at,
      })),
    };
  }

  private canAssignRole(
    currentUser: User,
    branchId: string,
    role: BranchRole,
  ): boolean {
    if (
      [GlobalRole.SUPER_ADMIN, GlobalRole.ADMIN].includes(
        currentUser.global_role,
      )
    ) {
      return true;
    }

    const branchAssignment = currentUser.user_branch_roles?.find(
      (r) => r.branch_id === branchId,
    );

    if (!branchAssignment) return false;
    if (branchAssignment.branch_role !== BranchRole.ADMIN) return false;
    if (role === BranchRole.ADMIN) return false;

    return true;
  }

  async findAll(pagination: PaginationDto) {
    const query = this.supabase.service.from('users').select(
      `
        *,
        user_branch_roles!user_branch_roles_user_id_fkey (
          *,
          branches (name)
        )
      `,
      { count: 'exact' },
    );

    const result = await this.supabase.paginate<any>(
      query.order('created_at', { ascending: false }),
      pagination,
    );

    return {
      ...result,
      data: result.data.map((u) => this.mapUser(u)),
    };
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const data = await this.supabase.single<any>(
      this.supabase.service
        .from('users')
        .select(
          `
          *,
          user_branch_roles!user_branch_roles_user_id_fkey (
            *,
            branches (name)
          )
        `,
        )
        .eq('id', id)
        .single(),
    );
    return this.mapUser(data);
  }

  async update(
    id: string,
    updateDto: UpdateUserDto,
    currentUser: User,
  ): Promise<UserResponseDto> {
    if (!this.permissionService.canUpdateUser(currentUser, id, updateDto)) {
      throw new ForbiddenException(
        'You do not have permission to update this user or these specific fields',
      );
    }

    const oldData = await this.findOne(id);

    await this.supabase.single(
      this.supabase.service
        .from('users')
        .update(updateDto)
        .eq('id', id)
        .select()
        .single(),
    );

    await this.auditService.log(
      currentUser,
      'UPDATE_PROFILE',
      'users',
      id,
      updateDto,
      oldData,
    );

    return this.findOne(id);
  }

  async removeBranchRole(roleId: string, currentUser: User) {
    const existingRole = await this.supabase.single(
      this.supabase.service
        .from('user_branch_roles')
        .select('*')
        .eq('id', roleId)
        .single(),
    );

    await this.supabase.query(
      this.supabase.service.from('user_branch_roles').delete().eq('id', roleId),
    );

    await this.auditService.log(
      currentUser,
      'REMOVE_ROLE',
      'user_branch_roles',
      roleId,
      null,
      existingRole,
    );

    return { success: true };
  }

  async assignOrUpdateBranchRole(dto: AssignUserRoleDto, currentUser: User) {
    const { user_id, branch_id, branch_role } = dto;

    if (!this.canAssignRole(currentUser, branch_id, branch_role)) {
      throw new ForbiddenException('You cannot assign this role');
    }

    const userExists = await this.supabase.service
      .from('users')
      .select('id')
      .eq('id', user_id)
      .single();

    if (userExists.error) {
      throw new NotFoundException(
        `Target user with ID ${user_id} not found in public profile. Ensure they have signed up correctly.`,
      );
    }

    const branchExists = await this.supabase.service
      .from('branches')
      .select('id')
      .eq('id', branch_id)
      .single();

    if (branchExists.error) {
      throw new NotFoundException(`Branch with ID ${branch_id} not found.`);
    }

    const { data, error } = await this.supabase.service
      .from('user_branch_roles')
      .upsert(
        {
          user_id,
          branch_id,
          branch_role,
          assigned_at: new Date(),
          assigned_by: currentUser.id,
        },
        { onConflict: 'user_id,branch_id' },
      )
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    await this.auditService.log(
      currentUser,
      'ASSIGN_ROLE',
      'user_branch_roles',
      data.id,
      { branch_id, branch_role, target_user_id: user_id },
    );

    return {
      message: 'Role assigned successfully',
      data: await this.findOne(user_id),
    };
  }
}
