import { Injectable, InternalServerErrorException, Logger, NotFoundException, BadRequestException } from "@nestjs/common";
import { getSupabaseAnonClient, getSupabaseServiceRoleClient } from "../lib/supabase.js";
import { PaginationDto } from "../dto/pagination.dto.js";

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);

  get anon() {
    return getSupabaseAnonClient();
  }

  get service() {
    return getSupabaseServiceRoleClient();
  }

  async query<T>(query: any): Promise<T> {
    const { data, error } = await query;

    if (error) {
      this.logger.error(`Supabase error: ${error.message}`, error);
      throw new InternalServerErrorException('Database operation failed');
    }

    return data;
  }

  /**
   * Fetch a single record or throw NotFoundException.
   * Handles both "not found" (PGRST116) and "invalid UUID format" (22P02).
   */
  async single<T>(query: any, customMessage?: string): Promise<T> {
    const { data, error } = await query;

    if (error) {
      // PGRST116: No rows found
      // 22P02: Invalid input syntax for type uuid
      if (error.code === 'PGRST116' || error.code === '22P02') {
        throw new NotFoundException(customMessage || 'Record not found');
      }

      this.logger.error(`Supabase error [${error.code}]: ${error.message}`, error);
      throw new InternalServerErrorException('Database operation failed');
    }

    return data as T;
  }

  /**
   * Reusable pagination helper
   */
  async paginate<T>(
    queryBuilder: any,
    options: PaginationDto,
  ): Promise<{ data: T[]; meta: { total: number; page: number; limit: number; lastPage: number } }> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await queryBuilder.range(from, to);

    if (error) {
      this.logger.error(`Supabase Pagination Error: ${error.message}`, error);
      throw new InternalServerErrorException('Database operation failed');
    }

    const total = count || 0;
    const lastPage = Math.ceil(total / limit);

    return {
      data: data as T[],
      meta: {
        total,
        page,
        limit,
        lastPage,
      },
    };
  }

  /**
   * Reusable voiding logic
   */
  async voidRecord<T>(
    table: string,
    id: string,
    reason: string,
    voidedBy: string,
  ): Promise<{ data: T; oldData: T }> {
    const oldData = await this.single<any>(
      this.service.from(table).select('*').eq('id', id).single(),
      `Record in ${table} with ID ${id} not found`
    );

    if (oldData.is_voided) {
      throw new BadRequestException(`Record in ${table} is already voided`);
    }

    const { data, error } = await this.service
      .from(table)
      .update({
        is_voided: true,
        void_reason: reason,
        voided_by: voidedBy,
        voided_at: new Date(),
        updated_at: new Date(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error(`Supabase Void Error: ${error.message}`, error);
      throw new InternalServerErrorException(`Failed to void record in ${table}`);
    }

    return { data: data as T, oldData: oldData as T };
  }
}
