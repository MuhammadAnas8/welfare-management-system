import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserRoleDto } from './dto/create-user-role.dto';

@Injectable()
export class UsersService {
  constructor(private readonly supabase: SupabaseService) {}

  async findAll() {
    return this.supabase.query(
      this.supabase.service.from('users').select('*, user_branch_roles(*)'),
    );
  }

  async findOne(id: string) {
    return this.supabase.single(
      this.supabase.service
        .from('users')
        .select('*, user_branch_roles(*)')
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

  async addBranchRole(userId: string, roleDto: CreateUserRoleDto) {
    return this.supabase.single(
      this.supabase.service
        .from('user_branch_roles')
        .insert({
          user_id: userId,
          branch_id: roleDto.branch_id,
          branch_role: roleDto.branch_role,
        })
        .select()
        .single(),
    );
  }

  async removeBranchRole(roleId: string) {
    await this.supabase.query(
      this.supabase.service.from('user_branch_roles').delete().eq('id', roleId),
    );

    return { success: true };
  }
}
