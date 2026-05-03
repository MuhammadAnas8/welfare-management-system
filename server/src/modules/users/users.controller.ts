import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { AssignUserRoleDto } from './dto/assign-role.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.gurad.js';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/guards/current-user.decorator.js';
import { User } from './interfaces/user.interface.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { GlobalRole, BranchRole } from './enums/roles.enum.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({operationId: 'getAllUsers' , summary: 'Get all users (Admins only)' })
  @Roles({ global: [GlobalRole.SUPER_ADMIN, GlobalRole.ADMIN] })
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @ApiOperation({operationId: 'getUserById' , summary: 'Get user information by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @ApiOperation({operationId: 'updateUser' , summary: 'Update user information (Self or Admin)' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateUserDto,
    @CurrentUser() currentUser: User,
  ) {
    // Basic protection: only admins can change global_role or is_active
    if (
      (updateDto.global_role || updateDto.is_active !== undefined) &&
      ![GlobalRole.SUPER_ADMIN, GlobalRole.ADMIN].includes(
        currentUser.global_role,
      )
    ) {
      throw new ForbiddenException('Only admins can update roles or status');
    }
    return this.usersService.update(id, updateDto);
  }

  @ApiOperation({operationId: 'assignBranchRole' , summary: 'Assign or Update user branch role' })
  @Roles({
    global: [GlobalRole.SUPER_ADMIN, GlobalRole.ADMIN],
    branch: [BranchRole.ADMIN],
  })
  @Post('roles')
  assignBranchRole(
    @Body() dto: AssignUserRoleDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.usersService.assignOrUpdateBranchRole(dto, currentUser);
  }

  @ApiOperation({operationId: 'removeBranchRole' , summary: 'Remove user branch role' })
  @Roles({
    global: [GlobalRole.SUPER_ADMIN, GlobalRole.ADMIN],
    branch: [BranchRole.ADMIN],
  })
  @Delete('roles/:roleId')
  removeBranchRole(
    @Param('roleId') roleId: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.usersService.removeBranchRole(roleId, currentUser);
  }
}
