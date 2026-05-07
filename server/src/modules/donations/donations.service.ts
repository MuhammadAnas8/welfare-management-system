import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service.js';
import { AuditService } from '../../common/audit/audit.service.js';
import { PermissionService } from '../../common/permissions/permission.service.js';
import { User } from '../users/interfaces/user.interface.js';
import { CreateDonationDto } from './dto/create-donation.dto.js';
import { UpdateDonationDto } from './dto/update-donation.dto.js';
import { VoidDonationDto } from './dto/void-donation.dto.js';
import { CreateTransferDto } from './dto/create-transfer.dto.js';
import { ConfirmTransferDto } from './dto/confirm-transfer.dto.js';
import { TransferStatus } from './enums/donation.enum.js';
import {
  Donation,
  DonationTransfer,
  Currency,
  DonationRaw,
} from './interfaces/donation.interface.js';
import { BranchRole } from '../users/enums/roles.enum.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { DonationResponseDto } from './dto/response-donation.dto.js';

@Injectable()
export class DonationsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly auditService: AuditService,
    private readonly permissionService: PermissionService,
  ) {}
  private async validateBranch(branchId: string) {
    return this.supabase.single(
      this.supabase.service
        .from('branches')
        .select('id')
        .eq('id', branchId)
        .single(),
      `Branch with ID ${branchId} not found.`,
    );
  }

  private async validateCurrency(currency: string) {
    return this.supabase.single(
      this.supabase.service
        .from('currencies')
        .select('code')
        .eq('code', currency)
        .eq('is_active', true)
        .single(),
      `Invalid or inactive currency code: ${currency}`,
    );
  }
  private mapDonation(d: any): DonationResponseDto {
    return {
      id: d.id,
      donor_name: d.donor_name,
      donor_phone: d.donor_phone,

      amount: d.amount,
      currency: d.currency,

      branch_id: d.branch?.id,
      branch_name: d.branch?.name,

      created_by: d.created_by?.id,
      created_by_name: d.created_by?.full_name,

      created_at: d.created_at,
    };
  }

  private async getDonationOrThrow(id: string): Promise<Donation> {
    return this.supabase.single<Donation>(
      this.supabase.service.from('donations').select('*').eq('id', id).single(),
      `Donation with ID ${id} not found`,
    );
  }

  private checkEditLock(donation: Donation) {
    const lockTime = new Date(donation.edit_locked_at).getTime();
    const now = new Date().getTime();

    if (now > lockTime) {
      throw new ForbiddenException(
        'Edit window expired (7 days). Please void and recreate if necessary.',
      );
    }
  }

  async getActiveCurrencies(): Promise<Currency[]> {
    return this.supabase.query(
      this.supabase.service
        .from('currencies')
        .select('*')
        .eq('is_active', true)
        .order('code'),
    );
  }

  async createDonation(dto: CreateDonationDto, currentUser: User) {
    this.permissionService.checkBranchAccess(currentUser, dto.branch_id, [
      BranchRole.ADMIN,
      BranchRole.EDITOR,
    ]);

    // Validate Branch exists (Simplified)
    await this.validateBranch(dto.branch_id);
    await this.validateCurrency(dto.currency);

    // 4. Perform Insert
    const data = await this.supabase.single<Donation>(
      this.supabase.service
        .from('donations')
        .insert({
          ...dto,
          is_voided: false,
          created_by: currentUser.id,
        })
        .select()
        .single(),
    );

    await this.auditService.log(
      currentUser,
      'CREATE',
      'donations',
      data.id,
      dto,
    );
    return data;
  }

  async findAllDonations(
    currentUser: User,
    pagination: PaginationDto,
    branchId?: string,
  ) {
    let query = this.supabase.service
      .from('donations')
      .select(
        `
      id, donor_name, donor_phone, amount, currency, created_at,

      branch:branches (
        id, name
      ),

      created_by:users!donations_created_by_fkey (
        id, full_name
      )
      `,
        { count: 'exact' },
      )
      .eq('is_voided', false);

    query = this.permissionService.applyVisibilityFilter(
      query,
      currentUser,
      branchId,
    );

    const result = await this.supabase.paginate<DonationRaw>(
      query.order('created_at', { ascending: false }),
      pagination,
    );

    return {
      ...result,
      data: result.data.map((d) => this.mapDonation(d)),
    };
  }

  async findOneDonation(id: string, currentUser: User) {
    const donation = await this.getDonationOrThrow(id);
    this.permissionService.checkBranchAccess(currentUser, donation.branch_id);

    return donation;
  }

  async update(id: string, dto: UpdateDonationDto, currentUser: User) {
    const donation = await this.getDonationOrThrow(id);
    this.permissionService.checkBranchAccess(currentUser, donation.branch_id, [
      BranchRole.ADMIN,
    ]);

    if (donation.is_voided) {
      throw new BadRequestException('Cannot update a voided donation');
    }

    this.checkEditLock(donation);

    const data = await this.supabase.single<Donation>(
      this.supabase.service
        .from('donations')
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
      'donations',
      id,
      dto,
      donation,
    );
    return data;
  }

  async void(id: string, dto: VoidDonationDto, currentUser: User) {
    const donation = await this.getDonationOrThrow(id);
    this.permissionService.checkBranchAccess(currentUser, donation.branch_id, [
      BranchRole.ADMIN,
    ]);

    const { data, oldData } = await this.supabase.voidRecord<Donation>(
      'donations',
      id,
      dto.reason,
      currentUser.id,
    );

    await this.auditService.log(
      currentUser,
      'VOID',
      'donations',
      id,
      dto,
      oldData,
    );

    return data;
  }

  // --- Transfers ---

  async submitTransfer(dto: CreateTransferDto, currentUser: User) {
    this.permissionService.checkBranchAccess(currentUser, dto.from_branch_id, [
      BranchRole.ADMIN,
    ]);

    // Simplified Validations using improved .single()
    await this.supabase.single(
      this.supabase.service
        .from('branches')
        .select('id')
        .eq('id', dto.from_branch_id)
        .single(),
      'Source branch not found',
    );

    await this.supabase.single(
      this.supabase.service
        .from('branches')
        .select('id')
        .eq('id', dto.to_branch_id)
        .single(),
      'Target branch not found',
    );

    await this.supabase.single(
      this.supabase.service
        .from('currencies')
        .select('code')
        .eq('code', dto.currency_original)
        .eq('is_active', true)
        .single(),
      'Invalid currency',
    );

    const data = await this.supabase.single<DonationTransfer>(
      this.supabase.service
        .from('donation_transfers')
        .insert({
          ...dto,
          status: TransferStatus.PENDING,
          submitted_by: currentUser.id,
          submitted_at: new Date(),
        })
        .select()
        .single(),
    );

    await this.auditService.log(
      currentUser,
      'TRANSFER_SUBMIT',
      'donation_transfers',
      data.id,
      dto,
    );
    return data;
  }

  async confirmTransfer(
    id: string,
    dto: ConfirmTransferDto,
    currentUser: User,
  ) {
    if (!this.permissionService.isGlobalAdmin(currentUser)) {
      throw new ForbiddenException(
        'Only Head Office admins can confirm transfers',
      );
    }

    const transfer = await this.supabase.single<DonationTransfer>(
      this.supabase.service
        .from('donation_transfers')
        .select('*')
        .eq('id', id)
        .single(),
      `Transfer with ID ${id} not found`,
    );

    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException('Transfer is already processed');
    }

    const data = await this.supabase.single<DonationTransfer>(
      this.supabase.service
        .from('donation_transfers')
        .update({
          status: TransferStatus.RECEIVED,
          received_pkr: dto.received_pkr,
          received_by: currentUser.id,
          received_at: new Date(),
        })
        .eq('id', id)
        .select()
        .single(),
    );

    await this.auditService.log(
      currentUser,
      'TRANSFER_CONFIRM',
      'donation_transfers',
      id,
      dto,
      transfer,
    );
    return data;
  }

  async getTransfers(
    currentUser: User,
    pagination: PaginationDto,
    branchId?: string,
  ) {
    let query = this.supabase.service
      .from('donation_transfers')
      .select('*', { count: 'exact' });

    if (branchId) {
      this.permissionService.checkBranchAccess(currentUser, branchId);
      query = query.or(
        `from_branch_id.eq.${branchId},to_branch_id.eq.${branchId}`,
      );
    } else if (!this.permissionService.isGlobalAdmin(currentUser)) {
      const authorizedBranches =
        this.permissionService.getAuthorizedBranches(currentUser);
      query = query.in('from_branch_id', authorizedBranches);
    }

    return this.supabase.paginate<DonationTransfer>(
      query.order('submitted_at', { ascending: false }),
      pagination,
    );
  }
}
