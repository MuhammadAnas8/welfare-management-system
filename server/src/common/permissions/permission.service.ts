import { Injectable, ForbiddenException } from '@nestjs/common';
import { User, UserBranchRole } from '../../modules/users/interfaces/user.interface.js';
import { GlobalRole, BranchRole } from '../../modules/users/enums/roles.enum.js';

@Injectable()
export class PermissionService {
  isGlobalAdmin(user: User): boolean {
    return [GlobalRole.SUPER_ADMIN, GlobalRole.ADMIN].includes(user.global_role);
  }


  hasGlobalRole(user: User, roles: GlobalRole[]): boolean {
    if (user.global_role === GlobalRole.SUPER_ADMIN) return true;
    return roles.includes(user.global_role);
  }


  hasBranchPermission(
    user: User,
    branchId: string,
    allowedRoles?: BranchRole[],
  ): boolean {
    // Super admins and global admins have access to all branches
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


  getAuthorizedBranches(user: User, role?: BranchRole): string[] {
    if (this.isGlobalAdmin(user)) return []; // Empty means "all" in context of global admins

    return (user.user_branch_roles || [])
      .filter((r) => !role || r.branch_role === role)
      .map((r) => r.branch_id);
  }

  checkBranchAccess(user: User, branchId: string, allowedRoles?: BranchRole[]) {
    if (!this.hasBranchPermission(user, branchId, allowedRoles)) {
      throw new ForbiddenException(
        `You do not have permission to access branch: ${branchId}`,
      );
    }
  }
}
