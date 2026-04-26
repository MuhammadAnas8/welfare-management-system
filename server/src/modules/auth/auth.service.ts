import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { getSupabaseAnonClient } from '../../lib/supabase';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

@Injectable()
export class AuthService {
  async signup(payload: SignupDto) {
    const supabase = getSupabaseAnonClient();
    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      user: data.user,
      session: data.session,
      message: data.session
        ? 'Signup successful.'
        : 'Signup successful. Check your email for confirmation.',
    };
  }

  async login(payload: LoginDto) {
    const supabase = getSupabaseAnonClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });

    if (error || !data.session) {
      throw new UnauthorizedException(error?.message ?? 'Invalid credentials');
    }

    return {
      user: data.user,
      session: data.session,
    };
  }
}
