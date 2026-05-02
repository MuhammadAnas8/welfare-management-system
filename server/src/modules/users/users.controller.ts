import { Controller, Get, Patch, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserRoleDto } from './dto/create-user-role.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.gurad';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiBearerAuth()
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateUserDto) {
    return this.usersService.update(id, updateDto);
  }

  @Post(':id/roles')
  addBranchRole(@Param('id') id: string, @Body() roleDto: CreateUserRoleDto) {
    return this.usersService.addBranchRole(id, roleDto);
  }

  @Delete('roles/:roleId')
  removeBranchRole(@Param('roleId') roleId: string) {
    return this.usersService.removeBranchRole(roleId);
  }
}
