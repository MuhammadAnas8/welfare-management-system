import { Module } from '@nestjs/common';
import { ExpensesController } from './expenses.controller.js';
import { ExpensesService } from './expenses.service.js';
import { SupabaseModule } from '../../common/supabase/supabase.module.js';
import { AuditModule } from '../../common/audit/audit.module.js';
import { PermissionModule } from '../../common/permissions/permission.module.js';

@Module({
  imports: [SupabaseModule, AuditModule, PermissionModule],
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
