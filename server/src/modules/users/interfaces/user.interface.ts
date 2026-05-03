import { GlobalRole, BranchRole } from '../enums/roles.enum.js';

export interface UserBranchRole {
  id: string;
  user_id: string;
  branch_id: string;
  branch_role: BranchRole;
  assigned_at: Date;
  assigned_by: string | null;
}

export interface User {
  id: string;
  full_name: string | null;
  email: string;
  global_role: GlobalRole;
  is_active: boolean;
  created_at: Date;
  user_branch_roles?: UserBranchRole[];
}

export interface Branch {
  id: string;
  name: string;
  country: string;
  currency_code: string;
  description: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}
