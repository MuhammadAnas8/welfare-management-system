import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { AssignUserRoleDto } from './dto/assign-role.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.gurad.js';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/guards/current-user.decorator.js';
import { User } from './interfaces/user.interface.js';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({
    operationId: 'getAllUsers',
    summary: 'Get all users',
    description: 'Returns a list of all users with their branch roles',
  })
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @ApiOperation({
    operationId: 'getUserById',
    summary: 'Get user information by ID',
    description: 'Returns user information along with their branch roles',
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @ApiOperation({
    operationId: 'updateUser',
    summary: 'Update user information',
    description:
      'Update user information such as full name, active status, and global role',
  })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateUserDto) {
    return this.usersService.update(id, updateDto);
  }

  @ApiOperation({
    operationId: 'assignBranchRole',
    summary: 'Assign or Update user branch role',
    description: 'Assign a role to a user for a specific branch or update existing one',
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
    description: 'Remove a role assignment from a user for a specific branch',
  })
  @Delete('roles/:roleId')
  removeBranchRole(
    @Param('roleId') roleId: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.usersService.removeBranchRole(roleId, currentUser);
  }
}
