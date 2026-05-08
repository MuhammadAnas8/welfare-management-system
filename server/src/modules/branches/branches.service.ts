import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service.js';
import { AuditService } from '../../common/audit/audit.service.js';
import { CreateBranchDto } from './dto/create-branch.dto.js';
import { UpdateBranchDto } from './dto/update-branch.dto.js';
import { User, Branch } from '../users/interfaces/user.interface.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { BranchResponseDto } from './dto/branch-response.dto.js';

@Injectable()
export class BranchesService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly auditService: AuditService,
  ) {}

  private mapBranch(b: any): BranchResponseDto {
    return {
      id: b.id,
      name: b.name,
      country: b.country,
      currency_code: b.currency_code,
      description: b.description,
      is_active: b.is_active,
      created_by: b.created_by_user?.id || b.created_by,
      created_by_name: b.created_by_user?.full_name,
      created_at: b.created_at,
      updated_at: b.updated_at,
    };
  }

  async findAll(pagination: PaginationDto) {
    const query = this.supabase.service
      .from('branches')
      .select(
        `
        *,
        created_by_user:users!branches_created_by_fkey (
          id, full_name
        )
      `,
        { count: 'exact' },
      );

    const result = await this.supabase.paginate<any>(
      query.order('name'),
      pagination,
    );

    return {
      ...result,
      data: result.data.map((b) => this.mapBranch(b)),
    };
  }

  async findOne(id: string): Promise<BranchResponseDto> {
    const data = await this.supabase.single<any>(
      this.supabase.service
        .from('branches')
        .select(
          `
          *,
          created_by_user:users!branches_created_by_fkey (
            id, full_name
          )
        `,
        )
        .eq('id', id)
        .single(),
    );
    return this.mapBranch(data);
  }

  async create(dto: CreateBranchDto, currentUser: User): Promise<BranchResponseDto> {
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

    return this.findOne(data.id);
  }

  async update(id: string, dto: UpdateBranchDto, currentUser: User): Promise<BranchResponseDto> {
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

    return this.findOne(data.id);
  }
}
