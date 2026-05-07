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

@Injectable()
export class UsersService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly auditService: AuditService,
    private readonly permissionService: PermissionService,
  ) {}

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
    const query = this.supabase.service
      .from('users')
      .select('*, user_branch_roles!user_branch_roles_user_id_fkey(branch_id, branch_role)', { count: 'exact' });
    return this.supabase.paginate<User>(
      query.order('created_at', { ascending: false }),
      pagination,
    );
  }

  async findOne(id: string) {
    return this.supabase.single(
      this.supabase.service
        .from('users')
        .select(
          '*, user_branch_roles!user_branch_roles_user_id_fkey(branch_id, branch_role)',
        )
        .eq('id', id)
        .single(),
    );
  }

  async update(id: string, updateDto: UpdateUserDto, currentUser: User) {
    // 1. Permission Check (Delegated to PermissionService)
    if (!this.permissionService.canUpdateUser(currentUser, id, updateDto)) {
      throw new ForbiddenException('You do not have permission to update this user or these specific fields');
    }

    const oldData = await this.findOne(id);

    // 2. Perform update
    const data = await this.supabase.single(
      this.supabase.service
        .from('users')
        .update(updateDto)
        .eq('id', id)
        .select()
        .single(),
    );

    // 3. Log the change
    await this.auditService.log(
      currentUser,
      'UPDATE_PROFILE',
      'users',
      id,
      updateDto,
      oldData,
    );

    return data;
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

    // 1. 🔐 Authorization check
    if (!this.canAssignRole(currentUser, branch_id, branch_role)) {
      throw new ForbiddenException('You cannot assign this role');
    }

    // 2. 🔍 Validate target user exists in public.users
    const userExists = await this.supabase.service
      .from('users')
      .select('id')
      .eq('id', user_id)
      .single();
    
    if (userExists.error) {
      throw new NotFoundException(`Target user with ID ${user_id} not found in public profile. Ensure they have signed up correctly.`);
    }

    // 3. 🔍 Validate branch exists
    const branchExists = await this.supabase.service
      .from('branches')
      .select('id')
      .eq('id', branch_id)
      .single();
    
    if (branchExists.error) {
      throw new NotFoundException(`Branch with ID ${branch_id} not found.`);
    }

    // 4. 🔄 UPSERT
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

    // 5. 🧾 Audit
    await this.auditService.log(
      currentUser,
      'ASSIGN_ROLE',
      'user_branch_roles',
      data.id,
      { branch_id, branch_role, target_user_id: user_id },
    );

    return { message: 'Role assigned successfully', data };
  }
}
