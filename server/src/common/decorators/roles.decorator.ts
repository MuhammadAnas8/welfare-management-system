import { SetMetadata } from '@nestjs/common';
import { GlobalRole, BranchRole } from '../../modules/users/enums/roles.enum.js';

export interface RolesMetadata {
  global?: GlobalRole[];
  branch?: BranchRole[];
}

export const ROLES_KEY = 'roles';
export const Roles = (metadata: RolesMetadata) => SetMetadata(ROLES_KEY, metadata);
