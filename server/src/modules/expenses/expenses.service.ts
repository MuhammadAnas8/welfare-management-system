import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service.js';
import { AuditService } from '../../common/audit/audit.service.js';
import { PermissionService } from '../../common/permissions/permission.service.js';
import { User } from '../users/interfaces/user.interface.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import { UpdateExpenseDto } from './dto/update-expense.dto.js';
import { RejectExpenseDto } from './dto/reject-expense.dto.js';
import { VoidExpenseDto } from './dto/void-expense.dto.js';
import { ExpenseStatus, FundSource } from './enums/expense.enum.js';
import { Expense } from './interfaces/expense.interface.js';
import { BranchRole } from '../users/enums/roles.enum.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { ExpenseResponseDto } from './dto/expense-response.dto.js';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly auditService: AuditService,
    private readonly permissionService: PermissionService,
  ) {}

  private mapExpense(e: any): ExpenseResponseDto {
    return {
      id: e.id,
      expense_number: e.expense_number,
      branch_id: e.branch_id,
      branch_name: e.branch?.name,
      created_by: e.created_by,
      created_by_name: e.creator?.full_name,
      approved_by: e.approved_by,
      approved_by_name: e.approver?.full_name,
      title: e.title,
      description: e.description,
      category: e.category,
      amount: e.amount,
      currency: e.currency,
      fund_source: e.fund_source,
      status: e.status,
      expense_date: e.expense_date,
      approved_at: e.approved_at,
      rejected_at: e.rejected_at,
      rejection_reason: e.rejection_reason,
      is_voided: e.is_voided,
      void_reason: e.void_reason,
      voided_at: e.voided_at,
      created_at: e.created_at,
      updated_at: e.updated_at,
    };
  }

  private async getExpenseOrThrow(id: string): Promise<Expense> {
    return this.supabase.single<Expense>(
      this.supabase.service.from('expenses').select('*').eq('id', id).single(),
      `Expense with ID ${id} not found`,
    );
  }

  private async generateExpenseNumber(): Promise<string> {
    const prefix = 'EXP';
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const { count } = await this.supabase.service
      .from('expenses')
      .select('*', { count: 'exact', head: true });
    
    const sequence = (count || 0) + 1;
    return `${prefix}-${datePart}-${sequence.toString().padStart(4, '0')}`;
  }

  // --- Core CRUD ---

  async create(dto: CreateExpenseDto, currentUser: User): Promise<ExpenseResponseDto> {
    this.permissionService.checkBranchAccess(currentUser, dto.branch_id, [
      BranchRole.ADMIN,
      BranchRole.EDITOR,
    ]);

    const expense_number = await this.generateExpenseNumber();

    const data = await this.supabase.single<any>(
      this.supabase.service
        .from('expenses')
        .insert({
          ...dto,
          expense_number,
          status: ExpenseStatus.DRAFT,
          created_by: currentUser.id,
        })
        .select(`
          *,
          branch:branches (name),
          creator:users!expenses_created_by_fkey (full_name)
        `)
        .single(),
    );

    await this.auditService.log(currentUser, 'CREATE', 'expenses', data.id, dto);
    return this.mapExpense(data);
  }

  async findAll(currentUser: User, pagination: PaginationDto, branchId?: string) {
    let query = this.supabase.service.from('expenses').select(
      `
        *,
        branch:branches (name),
        creator:users!expenses_created_by_fkey (full_name),
        approver:users!expenses_approved_by_fkey (full_name)
      `,
      { count: 'exact' },
    );

    query = this.permissionService.applyVisibilityFilter(query, currentUser, branchId);

    const result = await this.supabase.paginate<any>(
      query.order('created_at', { ascending: false }),
      pagination,
    );

    return {
      ...result,
      data: result.data.map((e) => this.mapExpense(e)),
    };
  }

  async findOne(id: string, currentUser: User): Promise<ExpenseResponseDto> {
    const data = await this.supabase.single<any>(
      this.supabase.service
        .from('expenses')
        .select(`
          *,
          branch:branches (name),
          creator:users!expenses_created_by_fkey (full_name),
          approver:users!expenses_approved_by_fkey (full_name)
        `)
        .eq('id', id)
        .single(),
      `Expense with ID ${id} not found`,
    );

    this.permissionService.checkBranchAccess(currentUser, data.branch_id);
    return this.mapExpense(data);
  }

  async update(id: string, dto: UpdateExpenseDto, currentUser: User): Promise<ExpenseResponseDto> {
    const expense = await this.getExpenseOrThrow(id);
    this.permissionService.checkBranchAccess(currentUser, expense.branch_id, [
      BranchRole.ADMIN,
      BranchRole.EDITOR,
    ]);

    if (expense.status !== ExpenseStatus.DRAFT) {
      throw new BadRequestException('Only draft expenses can be updated');
    }

    const data = await this.supabase.single<any>(
      this.supabase.service
        .from('expenses')
        .update({
          ...dto,
          updated_at: new Date(),
        })
        .eq('id', id)
        .select(`
          *,
          branch:branches (name),
          creator:users!expenses_created_by_fkey (full_name)
        `)
        .single(),
    );

    await this.auditService.log(currentUser, 'UPDATE', 'expenses', id, dto, expense);
    return this.mapExpense(data);
  }

  // --- Workflow Logic ---

  async approveLocal(id: string, currentUser: User): Promise<ExpenseResponseDto> {
    const expense = await this.getExpenseOrThrow(id);
    this.permissionService.checkBranchAccess(currentUser, expense.branch_id, [BranchRole.ADMIN]);

    if (expense.status !== ExpenseStatus.DRAFT) {
      throw new BadRequestException('Can only approve draft expenses locally');
    }

    if (expense.fund_source !== FundSource.LOCAL) {
      throw new BadRequestException('Only local fund sources can be approved by branch admin');
    }

    // Dynamic balance check
    const balance = await this.calculateBranchBalance(expense.branch_id);
    if (balance < expense.amount) {
      throw new BadRequestException(`Insufficient branch balance. Current: ${balance}, Required: ${expense.amount}`);
    }

    const data = await this.supabase.single<any>(
      this.supabase.service
        .from('expenses')
        .update({
          status: ExpenseStatus.APPROVED,
          approved_by: currentUser.id,
          approved_at: new Date(),
        })
        .eq('id', id)
        .select(`
          *,
          branch:branches (name),
          creator:users!expenses_created_by_fkey (full_name),
          approver:users!expenses_approved_by_fkey (full_name)
        `)
        .single(),
    );

    await this.auditService.log(currentUser, 'APPROVE_LOCAL', 'expenses', id, null, expense);
    return this.mapExpense(data);
  }

  async requestHO(id: string, currentUser: User): Promise<ExpenseResponseDto> {
    const expense = await this.getExpenseOrThrow(id);
    this.permissionService.checkBranchAccess(currentUser, expense.branch_id, [BranchRole.ADMIN]);

    if (expense.status !== ExpenseStatus.DRAFT) {
      throw new BadRequestException('Can only request HO funds for draft expenses');
    }

    if (expense.fund_source !== FundSource.HO) {
      throw new BadRequestException('Fund source must be set to HO to request HO funds');
    }

    const data = await this.supabase.single<any>(
      this.supabase.service
        .from('expenses')
        .update({
          status: ExpenseStatus.PENDING,
          updated_at: new Date(),
        })
        .eq('id', id)
        .select(`
          *,
          branch:branches (name),
          creator:users!expenses_created_by_fkey (full_name)
        `)
        .single(),
    );

    await this.auditService.log(currentUser, 'REQUEST_HO', 'expenses', id, null, expense);
    return this.mapExpense(data);
  }

  async approveHO(id: string, currentUser: User): Promise<ExpenseResponseDto> {
    if (!this.permissionService.isGlobalAdmin(currentUser)) {
      throw new ForbiddenException('Only HO admins can approve HO fund requests');
    }

    const expense = await this.getExpenseOrThrow(id);

    if (expense.status !== ExpenseStatus.PENDING) {
      throw new BadRequestException('Can only approve expenses in pending status');
    }

    // Dynamic balance check for HO
    const hoBalance = await this.calculateHOBalance();
    if (hoBalance < expense.amount) {
      throw new BadRequestException(`Insufficient HO balance. Current: ${hoBalance}, Required: ${expense.amount}`);
    }

    const data = await this.supabase.single<any>(
      this.supabase.service
        .from('expenses')
        .update({
          status: ExpenseStatus.APPROVED,
          approved_by: currentUser.id,
          approved_at: new Date(),
        })
        .eq('id', id)
        .select(`
          *,
          branch:branches (name),
          creator:users!expenses_created_by_fkey (full_name),
          approver:users!expenses_approved_by_fkey (full_name)
        `)
        .single(),
    );

    await this.auditService.log(currentUser, 'APPROVE_HO', 'expenses', id, null, expense);
    return this.mapExpense(data);
  }

  async reject(id: string, dto: RejectExpenseDto, currentUser: User): Promise<ExpenseResponseDto> {
    if (!this.permissionService.isGlobalAdmin(currentUser)) {
      throw new ForbiddenException('Only HO admins can reject HO fund requests');
    }

    const expense = await this.getExpenseOrThrow(id);

    if (expense.status !== ExpenseStatus.PENDING) {
      throw new BadRequestException('Can only reject expenses in pending status');
    }

    const data = await this.supabase.single<any>(
      this.supabase.service
        .from('expenses')
        .update({
          status: ExpenseStatus.REJECTED,
          rejected_by: currentUser.id,
          rejected_at: new Date(),
          rejection_reason: dto.reason,
        })
        .eq('id', id)
        .select(`
          *,
          branch:branches (name),
          creator:users!expenses_created_by_fkey (full_name)
        `)
        .single(),
    );

    await this.auditService.log(currentUser, 'REJECT', 'expenses', id, dto, expense);
    return this.mapExpense(data);
  }

  async void(id: string, dto: VoidExpenseDto, currentUser: User): Promise<ExpenseResponseDto> {
    const expense = await this.getExpenseOrThrow(id);
    
    // Check if user is HO admin OR branch admin for this branch
    const isHOAdmin = this.permissionService.isGlobalAdmin(currentUser);
    const isBranchAdmin = this.permissionService.hasBranchPermission(currentUser, expense.branch_id, [BranchRole.ADMIN]);

    if (!isHOAdmin && !isBranchAdmin) {
      throw new ForbiddenException('Only Admins can void expenses');
    }

    const data = await this.supabase.single<any>(
      this.supabase.service
        .from('expenses')
        .update({
          is_voided: true,
          void_reason: dto.reason,
          voided_by: currentUser.id,
          voided_at: new Date(),
        })
        .eq('id', id)
        .select(`
          *,
          branch:branches (name),
          creator:users!expenses_created_by_fkey (full_name),
          approver:users!expenses_approved_by_fkey (full_name)
        `)
        .single(),
    );

    await this.auditService.log(currentUser, 'VOID', 'expenses', id, dto, expense);
    return this.mapExpense(data);
  }

  // --- Balance & Stats ---

  async calculateBranchBalance(branchId: string): Promise<number> {
    // total donations
    const { data: donations } = await this.supabase.service
      .from('donations')
      .select('amount')
      .eq('branch_id', branchId)
      .eq('is_voided', false);
    
    const totalDonations = donations?.reduce((acc, d) => acc + Number(d.amount), 0) || 0;

    // transfers to HO (Assuming donation_transfers table handles this)
    const { data: transfers } = await this.supabase.service
      .from('donation_transfers')
      .select('amount_original')
      .eq('from_branch_id', branchId)
      .eq('status', 'received'); // Or appropriate status
    
    const totalTransfersOut = transfers?.reduce((acc, t) => acc + Number(t.amount_original), 0) || 0;

    // approved local expenses
    const { data: expenses } = await this.supabase.service
      .from('expenses')
      .select('amount')
      .eq('branch_id', branchId)
      .eq('status', ExpenseStatus.APPROVED)
      .eq('fund_source', FundSource.LOCAL)
      .eq('is_voided', false);
    
    const totalExpenses = expenses?.reduce((acc, e) => acc + Number(e.amount), 0) || 0;

    return totalDonations - totalTransfersOut - totalExpenses;
  }

  async calculateHOBalance(): Promise<number> {
    // received transfers (assuming they are converted to PKR in the transfers table)
    const { data: receivedTransfers } = await this.supabase.service
      .from('donation_transfers')
      .select('received_pkr')
      .eq('status', 'received');
    
    const totalReceived = receivedTransfers?.reduce((acc, t) => acc + Number(t.received_pkr || 0), 0) || 0;

    // approved HO expenses
    const { data: hoExpenses } = await this.supabase.service
      .from('expenses')
      .select('amount')
      .eq('status', ExpenseStatus.APPROVED)
      .eq('fund_source', FundSource.HO)
      .eq('is_voided', false);
    
    const totalHOExpenses = hoExpenses?.reduce((acc, e) => acc + Number(e.amount), 0) || 0;

    return totalReceived - totalHOExpenses;
  }

  async getBranchExpenseStats(branchId: string, currentUser: User) {
    this.permissionService.checkBranchAccess(currentUser, branchId);

    const { data: expenses } = await this.supabase.service
      .from('expenses')
      .select('amount, status, fund_source, is_voided')
      .eq('branch_id', branchId);
    
    const stats = {
      total_expenses: 0,
      approved_local: 0,
      approved_ho: 0,
      pending_ho: 0,
      current_balance: await this.calculateBranchBalance(branchId),
    };

    expenses?.forEach(e => {
      if (e.is_voided) return;
      const amt = Number(e.amount);
      if (e.status === ExpenseStatus.APPROVED) {
        if (e.fund_source === FundSource.LOCAL) stats.approved_local += amt;
        if (e.fund_source === FundSource.HO) stats.approved_ho += amt;
        stats.total_expenses += amt;
      } else if (e.status === ExpenseStatus.PENDING) {
        stats.pending_ho += amt;
      }
    });

    return stats;
  }

  async getHOExpenseStats(currentUser: User) {
    if (!this.permissionService.isGlobalAdmin(currentUser)) {
      throw new ForbiddenException('Only HO admins can view global stats');
    }

    const { data: expenses } = await this.supabase.service
      .from('expenses')
      .select('amount, status, fund_source, is_voided');
    
    const stats = {
      total_ho_expenses: 0,
      pending_requests: 0,
      ho_balance: await this.calculateHOBalance(),
    };

    expenses?.forEach(e => {
      if (e.is_voided) return;
      const amt = Number(e.amount);
      if (e.status === ExpenseStatus.APPROVED && e.fund_source === FundSource.HO) {
        stats.total_ho_expenses += amt;
      } else if (e.status === ExpenseStatus.PENDING) {
        stats.pending_requests += amt;
      }
    });

    return stats;
  }
}
