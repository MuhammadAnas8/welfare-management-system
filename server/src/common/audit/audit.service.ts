import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { User } from '../../modules/users/interfaces/user.interface';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  constructor(private readonly supabase: SupabaseService) {}

  async log(
    user: User,
    action: string,
    entity: string,
    entityId: string,
    newData: any,
    oldData: any = null,
  ) {
    const logEntry = {
      user_id: user.id,
      action,
      entity_type: entity,
      entity_id: entityId,
      old_data: oldData,
      new_data: newData,
      branch_id: newData?.branch_id || null,
      created_at: new Date(),
    };

    const { error } = await this.supabase.service
      .from('audit_logs')
      .insert(logEntry);

    if (error) {
      this.logger.error(
        `Failed to save audit log: ${error.message}`,
        error.stack,
      );
    }
  }
}
