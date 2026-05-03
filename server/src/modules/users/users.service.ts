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

@Injectable()
export class UsersService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly auditService: AuditService,
  ) {}

  private canAssignRole(
    currentUser: User,
    branchId: string,
    role: BranchRole,
  ): boolean {
    // Super Admin and Admin can assign any role
    if (
      [GlobalRole.SUPER_ADMIN, GlobalRole.ADMIN].includes(
        currentUser.global_role,
      )
    ) {
      return true;
    }

    // Find user's role in this branch
    const branchAssignment = currentUser.user_branch_roles?.find(
      (r) => r.branch_id === branchId,
    );

    if (!branchAssignment) return false;

    // Must be branch_admin to assign roles in a branch
    if (branchAssignment.branch_role !== BranchRole.ADMIN) return false;

    // Branch Admin cannot assign the branch_admin role to others
    if (role === BranchRole.ADMIN) return false;

    return true;
  }

  async findAll() {
    return this.supabase.query(
      this.supabase.service.from('users').select('*, roles:user_branch_roles!user_branch_roles_user_id_fkey(*)'),
    );
  }

  async findOne(id: string) {
    return this.supabase.single(
      this.supabase.service
        .from('users')
        .select('*, roles:user_branch_roles!user_branch_roles_user_id_fkey(*)')
        .eq('id', id)
        .single(),
    );
  }

  async update(id: string, updateDto: UpdateUserDto) {
    return this.supabase.single(
      this.supabase.service
        .from('users')
        .update(updateDto)
        .eq('id', id)
        .select()
        .single(),
    );
  }

  async removeBranchRole(roleId: string, currentUser: User) {
    // Optional: Add permission check for deletion
    
    // Get existing role for audit
    const existingRole = await this.supabase.single(
      this.supabase.service
        .from('user_branch_roles')
        .select('*')
        .eq('id', roleId)
        .single()
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
      existingRole
    );

    return { success: true };
  }

  async assignOrUpdateBranchRole(dto: AssignUserRoleDto, currentUser: User) {
    const { user_id, branch_id, branch_role } = dto;

    // 🔐 Permission check
    if (!this.canAssignRole(currentUser, branch_id, branch_role)) {
      throw new ForbiddenException('You cannot assign this role');
    }

    // 🔄 UPSERT
    // Note: This requires a unique constraint on (user_id, branch_id) in the DB
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

    // 🧾 Audit
    await this.auditService.log(
      currentUser,
      'ASSIGN_ROLE',
      'user_branch_roles',
      data.id,
      { branch_id, branch_role },
    );

    return { message: 'Role assigned successfully', data };
  }
}
