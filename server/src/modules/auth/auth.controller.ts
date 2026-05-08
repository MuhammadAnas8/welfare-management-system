import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { SignupDto } from './dto/signup.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.gurad.js';
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { MeResponseDto } from './dto/me.response.dto.js';
import { AuthResponseDto } from './dto/auth-response.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ operationId: 'signup', summary: 'User registration' })
  @ApiOkResponse({ type: AuthResponseDto })
  @Post('signup')
  signup(@Body() payload: SignupDto): Promise<AuthResponseDto> {
    return this.authService.signup(payload);
  }

  @ApiOperation({
    operationId: 'login',
    summary: 'User login',
    description: 'Returns access token',
  })
  @ApiOkResponse({ type: AuthResponseDto })
  @Post('login')
  @HttpCode(200)
  login(@Body() payload: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(payload);
  }

  @ApiBearerAuth()
  @ApiOperation({
    operationId: 'getMe',
    summary: 'Get current user information',
    description: 'get current user information',
  })
  @ApiOkResponse({ type: MeResponseDto })
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req: any): MeResponseDto {
    return this.authService.getMe(req.user);
  }
}
