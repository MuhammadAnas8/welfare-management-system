import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { AssignUserRoleDto } from './dto/assign-role.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.gurad.js';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from './interfaces/user.interface.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { GlobalRole, BranchRole } from './enums/roles.enum.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserResponseDto } from './dto/user-response.dto.js';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({
    operationId: 'getAllUsers',
    summary: 'Get all users (Admins only)',
  })
  @ApiOkResponse({ type: [UserResponseDto] })
  @Roles({ global: [GlobalRole.SUPER_ADMIN, GlobalRole.ADMIN] })
  @Get()
  findAll(@Query() pagination: PaginationDto) {
    return this.usersService.findAll(pagination);
  }

  @ApiOperation({
    operationId: 'getUserById',
    summary: 'Get user information by ID',
  })
  @ApiOkResponse({ type: UserResponseDto })
  @Roles({ global: [GlobalRole.SUPER_ADMIN, GlobalRole.ADMIN] })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @ApiOperation({
    operationId: 'updateUser',
    summary: 'Update user information (Self or Admin)',
  })
  @ApiOkResponse({ type: UserResponseDto })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateUserDto,
    @CurrentUser() currentUser: User,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, updateDto, currentUser);
  }

  @ApiOperation({
    operationId: 'assignBranchRole',
    summary: 'Assign or Update user branch role',
  })
  @ApiOkResponse({ type: UserResponseDto })
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

  @ApiOperation({
    operationId: 'removeBranchRole',
    summary: 'Remove user branch role',
  })
  @Delete('roles/:roleId')
  removeBranchRole(
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.usersService.removeBranchRole(roleId, currentUser);
  }
}
