import { Injectable, ForbiddenException } from '@nestjs/common';
import { User } from '../../modules/users/interfaces/user.interface.js';
import {
  GlobalRole,
  BranchRole,
} from '../../modules/users/enums/roles.enum.js';
import { UpdateUserDto } from '../../modules/users/dto/update-user.dto.js';

@Injectable()
export class PermissionService {
  /**
   * Check if user is a Super Admin or Admin (Global level)
   */
  isGlobalAdmin(user: User): boolean {
    return [GlobalRole.SUPER_ADMIN, GlobalRole.ADMIN].includes(
      user.global_role,
    );
  }

  /**
   * Check if user has a specific global role
   */
  hasGlobalRole(user: User, roles: GlobalRole[]): boolean {
    if (user.global_role === GlobalRole.SUPER_ADMIN) return true;
    return roles.includes(user.global_role);
  }

  /**
   * Check if user has access to a specific branch with required roles
   */
  hasBranchPermission(
    user: User,
    branchId: string,
    allowedRoles?: BranchRole[],
  ): boolean {
    if (this.isGlobalAdmin(user)) return true;

    const branchRole = user.user_branch_roles?.find(
      (r) => r.branch_id === branchId,
    );

    if (!branchRole) return false;

    if (allowedRoles && allowedRoles.length > 0) {
      return allowedRoles.includes(branchRole.branch_role);
    }

    return true;
  }

  /**
   * Get all branch IDs where the user has a specific role
   */
  getAuthorizedBranches(user: User, role?: BranchRole): string[] {
    if (this.isGlobalAdmin(user)) return [];

    return (user.user_branch_roles || [])
      .filter((r) => !role || r.branch_role === role)
      .map((r) => r.branch_id);
  }

  /**
   * Helper to apply visibility filters to a query based on user permissions
   */
  applyVisibilityFilter(
    query: any,
    user: User,
    branchId?: string,
    branchColumn = 'branch_id',
  ) {
    if (branchId) {
      this.checkBranchAccess(user, branchId);
      return query.eq(branchColumn, branchId);
    }

    if (!this.isGlobalAdmin(user)) {
      const authorizedBranches = this.getAuthorizedBranches(user);
      return query.in(branchColumn, authorizedBranches);
    }

    return query;
  }

  /**
   * Enforce branch access (throws ForbiddenException)
   */
  checkBranchAccess(user: User, branchId: string, allowedRoles?: BranchRole[]) {
    if (!this.hasBranchPermission(user, branchId, allowedRoles)) {
      throw new ForbiddenException(
        `You do not have permission to access branch: ${branchId}`,
      );
    }
  }

  /**
   * Specialized check for User updates
   */
  canUpdateUser(
    currentUser: User,
    targetUserId: string,
    dto: UpdateUserDto,
  ): boolean {
    const isAdmin = this.hasGlobalRole(currentUser, [
      GlobalRole.SUPER_ADMIN,
      GlobalRole.ADMIN,
    ]);
    const isSuperAdmin = currentUser.global_role === GlobalRole.SUPER_ADMIN;
    const isSelf = currentUser.id === targetUserId;

    if (!isAdmin && !isSelf) return false;

    if ((dto.global_role || dto.is_active !== undefined) && !isAdmin) {
      return false;
    }

    if (dto.global_role === GlobalRole.SUPER_ADMIN && !isSuperAdmin) {
      return false;
    }

    return true;
  }
}
