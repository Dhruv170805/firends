import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class OptionalSupabaseGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    request.user = null;

    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return true;
    }

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      return true;
    }

    try {
      const client = this.supabaseService.getClient();
      const {
        data: { user },
        error,
      } = await client.auth.getUser(token);
      if (!error && user) {
        request.user = { userId: user.id, email: user.email };
      }
    } catch {
      // Ignore errors for optional authentication
    }

    return true;
  }
}
