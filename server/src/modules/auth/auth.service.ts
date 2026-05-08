import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { getSupabaseAnonClient } from '../../common/lib/supabase.js';
import { LoginDto } from './dto/login.dto.js';
import { SignupDto } from './dto/signup.dto.js';
import { AuthResponseDto } from './dto/auth-response.dto.js';
import { MeResponseDto } from './dto/me.response.dto.js';

@Injectable()
export class AuthService {
  private mapAuthResponse(data: any, message?: string): AuthResponseDto {
    return {
      message,
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || data.user.full_name,
      accessToken: data.session?.access_token,
      refreshToken: data.session?.refresh_token,
      expiresAt: data.session?.expires_at,
    };
  }

  private mapMe(user: any): MeResponseDto {
    return {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      global_role: user.global_role,
      branches: (user.user_branch_roles || []).map((ubr: any) => ({
        id: ubr.id,
        branch_id: ubr.branch_id,
        branch_role: ubr.branch_role,
        assigned_at: ubr.assigned_at,
      })),
    };
  }

  async signup(payload: SignupDto): Promise<AuthResponseDto> {
    const supabase = getSupabaseAnonClient();
    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          name: payload.name,
        },
      },
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    const message = data.session
      ? 'Signup successful.'
      : 'Signup successful. Check your email for confirmation.';

    return this.mapAuthResponse(data, message);
  }

  async login(payload: LoginDto): Promise<AuthResponseDto> {
    const supabase = getSupabaseAnonClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });

    if (error || !data.session) {
      throw new UnauthorizedException(error?.message ?? 'Invalid credentials');
    }

    return this.mapAuthResponse(data);
  }

  getMe(user: any): MeResponseDto {
    return this.mapMe(user);
  }
}
