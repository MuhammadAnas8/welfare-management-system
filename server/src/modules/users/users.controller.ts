import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserRoleDto } from './dto/create-user-role.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.gurad';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}


  @ApiOperation({operationId: 'getAllUsers', summary: 'Get all users', description: 'Returns a list of all users with their branch roles' })
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @ApiOperation({operationId: 'getUserById', summary: 'Get user information by ID', description: 'Returns user information along with their branch roles' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @ApiOperation({operationId: 'updateUser', summary: 'Update user information', description: 'Update user information such as full name, active status, and global role' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateUserDto) {
    return this.usersService.update(id, updateDto);
  }

  @ApiOperation({operationId: 'addBranchRole', summary: 'Assign user a Role', description: 'Assign a role to a user for a specific branch' })
  @Post(':id/roles')
  addBranchRole(@Param('id') id: string, @Body() roleDto: CreateUserRoleDto) {
    return this.usersService.addBranchRole(id, roleDto);
  }

  @ApiOperation({operationId: 'removeBranchRole', summary: 'Remove user Role', description: 'Remove a role from a user for a specific branch' })
  @Delete('roles/:roleId')
  removeBranchRole(@Param('roleId') roleId: string) {
    return this.usersService.removeBranchRole(roleId);
  }
}
