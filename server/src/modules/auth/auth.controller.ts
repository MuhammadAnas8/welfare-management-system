import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.gurad';
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { MeResponseDto } from './dto/me.response.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ operationId: 'signup', summary: 'User registration' })
  @Post('signup')
  signup(@Body() payload: SignupDto) {
    return this.authService.signup(payload);
  }

  @ApiOperation({
    operationId: 'login',
    summary: 'User login',
    description: 'Returns access token',
  })
  @Post('login')
  @HttpCode(200)
  login(@Body() payload: LoginDto) {
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
