import { Injectable, InternalServerErrorException, Logger, NotFoundException } from "@nestjs/common";
import { getSupabaseAnonClient, getSupabaseServiceRoleClient } from "../lib/supabase";
import { PostgrestSingleResponse } from "@supabase/supabase-js";

// common/lib/supabase.service.ts
@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);

  get anon() {
    return getSupabaseAnonClient();
  }

  get service() {
    return getSupabaseServiceRoleClient();
  }

  async query<T>(query:any): Promise<T> {
    const { data, error } = await query;

    if (error) {
      this.logger.error(`Supabase error: ${error.message}`, error);
      throw new InternalServerErrorException('Database operation failed');
    }

    return data;
  }

async single<T>(
  query: any
): Promise<T> {
  const { data, error } = await query;

  if (error) {
    if (error.code === 'PGRST116') {
      throw new NotFoundException('Record not found');
    }

    this.logger.error(`Supabase error: ${error.message}`, error);
    throw new InternalServerErrorException('Database operation failed');
  }

  return data as T;
}
}