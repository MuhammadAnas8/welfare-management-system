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
import { DonationStatus, TransferStatus } from './enums/donation.enum.js';
import { Donation, DonationTransfer, Currency } from './interfaces/donation.interface.js';
import { BranchRole } from '../users/enums/roles.enum.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';

@Injectable()
export class DonationsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly auditService: AuditService,
    private readonly permissionService: PermissionService,
  ) {}

  private async getDonationOrThrow(id: string): Promise<Donation> {
    return this.supabase.single<Donation>(
      this.supabase.service.from('donations').select('*').eq('id', id).single(),
    );
  }

  /**
   * Application-level check for the 7-day edit lock.
   * This complements the DB trigger `trg_donation_edit_lock`.
   */
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

  async create(dto: CreateDonationDto, currentUser: User) {
    this.permissionService.checkBranchAccess(currentUser, dto.branch_id, [
      BranchRole.ADMIN,
      BranchRole.EDITOR,
    ]);

    const data = await this.supabase.single<Donation>(
      this.supabase.service
        .from('donations')
        .insert({
          ...dto,
          status: DonationStatus.ACTIVE,
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

  async findAll(currentUser: User, pagination: PaginationDto, branchId?: string) {
    let query = this.supabase.service
      .from('donations')
      .select('*', { count: 'exact' });

    if (branchId) {
      this.permissionService.checkBranchAccess(currentUser, branchId);
      query = query.eq('branch_id', branchId);
    } else if (!this.permissionService.isGlobalAdmin(currentUser)) {
      const authorizedBranches =
        this.permissionService.getAuthorizedBranches(currentUser);
      query = query.in('branch_id', authorizedBranches);
    }

    return this.supabase.paginate<Donation>(
      query.order('created_at', { ascending: false }),
      pagination,
    );
  }

  async findOne(id: string, currentUser: User) {
    const donation = await this.getDonationOrThrow(id);
    this.permissionService.checkBranchAccess(currentUser, donation.branch_id);
    return donation;
  }

  async update(id: string, dto: UpdateDonationDto, currentUser: User) {
    const donation = await this.getDonationOrThrow(id);
    this.permissionService.checkBranchAccess(currentUser, donation.branch_id, [
      BranchRole.ADMIN,
      BranchRole.EDITOR,
    ]);

    if (donation.status === DonationStatus.VOIDED) {
      throw new BadRequestException('Cannot update a voided donation');
    }

    // Enforce 7-day lock
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

    if (donation.status === DonationStatus.VOIDED) {
      throw new BadRequestException('Donation is already voided');
    }

    const data = await this.supabase.single<Donation>(
      this.supabase.service
        .from('donations')
        .update({
          status: DonationStatus.VOIDED,
          void_reason: dto.reason,
          voided_by: currentUser.id,
          voided_at: new Date(),
          updated_at: new Date(),
        })
        .eq('id', id)
        .select()
        .single(),
    );

    await this.auditService.log(
      currentUser,
      'VOID',
      'donations',
      id,
      dto,
      donation,
    );
    return data;
  }

  // --- Transfers ---

  async submitTransfer(dto: CreateTransferDto, currentUser: User) {
    this.permissionService.checkBranchAccess(currentUser, dto.from_branch_id, [
      BranchRole.ADMIN,
    ]);

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

  async confirmTransfer(id: string, dto: ConfirmTransferDto, currentUser: User) {
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

  async getTransfers(currentUser: User, pagination: PaginationDto, branchId?: string) {
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
