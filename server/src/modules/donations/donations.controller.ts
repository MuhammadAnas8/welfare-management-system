import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DonationsService } from './donations.service.js';
import { CreateDonationDto } from './dto/create-donation.dto.js';
import { UpdateDonationDto } from './dto/update-donation.dto.js';
import { VoidDonationDto } from './dto/void-donation.dto.js';
import { CreateTransferDto } from './dto/create-transfer.dto.js';
import { ConfirmTransferDto } from './dto/confirm-transfer.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.gurad.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { BranchRole, GlobalRole } from '../users/enums/roles.enum.js';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
// import { CurrentUser } from '../../common/guards/current-user.decorator.js';
import { User } from '../users/interfaces/user.interface.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { AppLogger } from '../../common/logger/app-logger.service.js';

@ApiTags('Donations')
@ApiBearerAuth()
@Controller('donations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @ApiOperation({ summary: 'Get list of supported currencies' })
  @Get('currencies')
  getActiveCurrencies() {
    return this.donationsService.getActiveCurrencies();
  }

  @ApiOperation({ summary: 'Create a new donation' })
  @Roles({ branch: [BranchRole.ADMIN, BranchRole.EDITOR]})
  @Post()
  create(@Body() dto: CreateDonationDto, @CurrentUser() currentUser: User) {
    new AppLogger().log('Creating donation', { dto, userId: currentUser.id } ,"branch roles: " + currentUser.user_branch_roles?.map(r => `${r.branch_id}:${r.branch_role}`).join(', '));
    return this.donationsService.create(dto, currentUser);
  }

  @ApiOperation({ summary: 'List donations with branch filtering' })
  @ApiQuery({ name: 'branchId', required: false })
  @Get()
  findAll(
    @Query('branchId') branchId: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.donationsService.findAll(currentUser, branchId);
  }

  @ApiOperation({ summary: 'Get donation by ID' })
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.donationsService.findOne(id, currentUser);
  }

  @ApiOperation({ summary: 'Update donation (Within 7 days)' })
  @Roles({ branch: [BranchRole.ADMIN, BranchRole.EDITOR] })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDonationDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.donationsService.update(id, dto, currentUser);
  }

  @ApiOperation({ summary: 'Void a donation (Admin only)' })
  @Roles({ branch: [BranchRole.ADMIN] , global: [GlobalRole.SUPER_ADMIN, GlobalRole.ADMIN] })
  @Patch(':id/void')
  void(
    @Param('id') id: string,
    @Body() dto: VoidDonationDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.donationsService.void(id, dto, currentUser);
  }

  // --- Transfers ---

  @ApiOperation({ summary: 'Submit funds transfer to Head Office' })
  @Roles({ branch: [BranchRole.ADMIN] })
  @Post('transfers')
  submitTransfer(@Body() dto: CreateTransferDto, @CurrentUser() currentUser: User) {
    return this.donationsService.submitTransfer(dto, currentUser);
  }

  @ApiOperation({ summary: 'List transfers with branch filtering' })
  @ApiQuery({ name: 'branchId', required: false })
  @Get('transfers/history')
  getTransfers(
    @Query('branchId') branchId: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.donationsService.getTransfers(currentUser, branchId);
  }

  @ApiOperation({ summary: 'Confirm received transfer (Head Office Admin only)' })
  @Roles({ global: [GlobalRole.SUPER_ADMIN, GlobalRole.ADMIN] })
  @Post('transfers/:id/confirm')
  confirmTransfer(
    @Param('id') id: string,
    @Body() dto: ConfirmTransferDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.donationsService.confirmTransfer(id, dto, currentUser);
  }
}
