import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import { UpdateExpenseDto } from './dto/update-expense.dto.js';
import { RejectExpenseDto } from './dto/reject-expense.dto.js';
import { VoidExpenseDto } from './dto/void-expense.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.gurad.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { User } from '../users/interfaces/user.interface.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { ExpenseResponseDto } from './dto/expense-response.dto.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { GlobalRole, BranchRole } from '../users/enums/roles.enum.js';

@ApiTags('Expenses')
@ApiBearerAuth()
@Controller('expenses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @ApiOperation({ summary: 'Get all expenses with pagination and filtering' })
  @ApiOkResponse({ type: [ExpenseResponseDto] })
  @Get()
  findAll(
    @CurrentUser() currentUser: User,
    @Query() pagination: PaginationDto,
    @Query('branch_id') branchId?: string,
  ) {
    return this.expensesService.findAll(currentUser, pagination, branchId);
  }

  @ApiOperation({ summary: 'Get HO global expense stats' })
  @Roles({ global: [GlobalRole.SUPER_ADMIN, GlobalRole.ADMIN] })
  @Get('stats/ho')
  getHOStats(@CurrentUser() currentUser: User) {
    return this.expensesService.getHOExpenseStats(currentUser);
  }

  @ApiOperation({ summary: 'Get branch specific expense stats' })
  @Get('stats/branch/:branchId')
  getBranchStats(
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.expensesService.getBranchExpenseStats(branchId, currentUser);
  }

  @ApiOperation({ summary: 'Get expense by ID' })
  @ApiOkResponse({ type: ExpenseResponseDto })
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: User,
  ): Promise<ExpenseResponseDto> {
    return this.expensesService.findOne(id, currentUser);
  }

  @ApiOperation({ summary: 'Create new expense draft' })
  @ApiOkResponse({ type: ExpenseResponseDto })
  @Post()
  create(
    @Body() dto: CreateExpenseDto,
    @CurrentUser() currentUser: User,
  ): Promise<ExpenseResponseDto> {
    return this.expensesService.create(dto, currentUser);
  }

  @ApiOperation({ summary: 'Update draft expense' })
  @ApiOkResponse({ type: ExpenseResponseDto })
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExpenseDto,
    @CurrentUser() currentUser: User,
  ): Promise<ExpenseResponseDto> {
    return this.expensesService.update(id, dto, currentUser);
  }

  @ApiOperation({ summary: 'Approve local fund expense (Branch Admin)' })
  @Post(':id/approve-local')
  approveLocal(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.expensesService.approveLocal(id, currentUser);
  }

  @ApiOperation({ summary: 'Submit expense for HO approval (Branch Admin)' })
  @Post(':id/request-ho')
  requestHO(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.expensesService.requestHO(id, currentUser);
  }

  @ApiOperation({ summary: 'Approve HO fund request (HO Admin)' })
  @Roles({ global: [GlobalRole.SUPER_ADMIN, GlobalRole.ADMIN] })
  @Post(':id/approve-ho')
  approveHO(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.expensesService.approveHO(id, currentUser);
  }

  @ApiOperation({ summary: 'Reject HO fund request (HO Admin)' })
  @Roles({ global: [GlobalRole.SUPER_ADMIN, GlobalRole.ADMIN] })
  @Post(':id/reject')
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectExpenseDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.expensesService.reject(id, dto, currentUser);
  }

  @ApiOperation({ summary: 'Void an expense' })
  @Post(':id/void')
  void(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VoidExpenseDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.expensesService.void(id, dto, currentUser);
  }
}
