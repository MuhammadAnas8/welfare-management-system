import { Injectable, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service.js';
import { AuditService } from '../../common/audit/audit.service.js';
import { CreateBranchDto } from './dto/create-branch.dto.js';
import { UpdateBranchDto } from './dto/update-branch.dto.js';
import { User, Branch } from '../users/interfaces/user.interface.js';
import { GlobalRole } from '../users/enums/roles.enum.js';

@Injectable()
export class BranchesService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly auditService: AuditService,
  ) {}

  private checkAdminPermission(user: User) {
    if (![GlobalRole.SUPER_ADMIN, GlobalRole.ADMIN].includes(user.global_role)) {
      throw new ForbiddenException('Only system admins can manage branches');
    }
  }

  async findAll() {
    return this.supabase.query(
      this.supabase.service.from('branches').select('*').order('name'),
    );
  }

  async findOne(id: string) {
    return this.supabase.single(
      this.supabase.service.from('branches').select('*').eq('id', id).single(),
    );
  }

  async create(dto: CreateBranchDto, currentUser: User) {
    this.checkAdminPermission(currentUser);

    const data = await this.supabase.single<Branch>(
      this.supabase.service
        .from('branches')
        .insert({
          ...dto,
          created_by: currentUser.id,
        })
        .select()
        .single(),
    );

    await this.auditService.log(
      currentUser,
      'CREATE',
      'branches',
      data.id,
      dto,
    );

    return data;
  }

  async update(id: string, dto: UpdateBranchDto, currentUser: User) {
    this.checkAdminPermission(currentUser);

    const oldData = await this.findOne(id);

    const data = await this.supabase.single<Branch>(
      this.supabase.service
        .from('branches')
        .update({
          ...dto,
          updated_at: new Date(),
        })
        .eq('id', id)
        .select()
        .single(),
    );

    await this.auditService.log(
      currentUser,
      'UPDATE',
      'branches',
      id,
      dto,
      oldData,
    );

    return data;
  }
}
