import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  getSupabaseAnonClient,
  getSupabaseServiceRoleClient,
} from '../lib/supabase.js';
import { SupabaseService } from '../supabase/supabase.service.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}
  private readonly logger = new Logger(JwtAuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: unknown }>();
    const header = req.headers.authorization;

    if (!header) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Malformed Authorization header');
    }

    const supabase = getSupabaseAnonClient();
    const { data: authData, error: authError } =
      await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      this.logger.warn(
        `Token verification failed for ${req.method} ${req.originalUrl ?? req.url}: ${authError?.message ?? 'No user in token'}`,
        'JwtAuthGuard',
      );
      throw new UnauthorizedException('Invalid or expired access token');
    }

    const profile = await this.supabaseService.single(
      this.supabaseService.service
        .from('users')
        .select('*, user_branch_roles!user_branch_roles_user_id_fkey(*)')
        .eq('id', authData.user.id)
        .single(),
    );

    req.user = profile;

    return true;
  }
}
