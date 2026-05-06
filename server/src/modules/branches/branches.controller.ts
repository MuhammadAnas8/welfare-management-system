import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { BranchesService } from './branches.service.js';
import { CreateBranchDto } from './dto/create-branch.dto.js';
import { UpdateBranchDto } from './dto/update-branch.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.gurad.js';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from '../users/interfaces/user.interface.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { GlobalRole } from '../users/enums/roles.enum.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@ApiTags('Branches')
@ApiBearerAuth()
@Controller('branches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @ApiOperation({ summary: 'Get all branches with pagination' })
  @Get()
  findAll(@Query() pagination: PaginationDto) {
    return this.branchesService.findAll(pagination);
  }

  @ApiOperation({ summary: 'Get branch by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.branchesService.findOne(id);
  }

  @ApiOperation({ summary: 'Create new branch (Admin only)' })
  @Roles({ global: [GlobalRole.SUPER_ADMIN, GlobalRole.ADMIN] })
  @Post()
  create(@Body() dto: CreateBranchDto, @CurrentUser() currentUser: User) {
    return this.branchesService.create(dto, currentUser);
  }

  @ApiOperation({ summary: 'Update branch (Admin only)' })
  @Roles({ global: [GlobalRole.SUPER_ADMIN, GlobalRole.ADMIN] })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.branchesService.update(id, dto, currentUser);
  }
}
