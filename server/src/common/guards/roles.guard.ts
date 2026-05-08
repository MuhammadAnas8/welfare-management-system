import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, RolesMetadata } from '../decorators/roles.decorator.js';
import { PermissionService } from '../permissions/permission.service.js';
import { User } from '../../modules/users/interfaces/user.interface.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesMetadata = this.reflector.getAllAndOverride<RolesMetadata>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!rolesMetadata) {
      return true; // No roles defined, allow access (default to authenticated)
    }

    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    if (!user) {
      throw new ForbiddenException('User context not found');
    }

    // 1. Check Global Roles
    if (rolesMetadata.global && rolesMetadata.global.length > 0) {
      if (this.permissionService.hasGlobalRole(user, rolesMetadata.global)) {
        return true;
      }
    }

    // 2. Check Branch Roles (if applicable)
    if (rolesMetadata.branch && rolesMetadata.branch.length > 0) {

      // Try to find branchId in request (params, body, or query)
      const branchId =
        request.params.branchId ||
        request.params.branch_id ||
        request.body.branchId ||
        request.body.branch_id ||
        request.query.branchId ||
        request.query.branch_id;

      if (branchId) {
        if (
          this.permissionService.hasBranchPermission(
            user,
            branchId,
            rolesMetadata.branch,
          )
        ) {
          return true;
        }
      } else {
        // If branch roles are required but no branchId is provided, 
        // we check if they have ANY valid branch assignment matching the required roles
        const hasAnyBranchRole = user.user_branch_roles?.some((r) =>
          rolesMetadata.branch?.includes(r.branch_role),
        );
        if (hasAnyBranchRole) return true;
      }
    }

    throw new ForbiddenException('Insufficient permissions to perform this action');
  }
}
