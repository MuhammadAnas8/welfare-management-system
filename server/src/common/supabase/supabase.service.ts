import { Injectable, InternalServerErrorException, Logger, NotFoundException } from "@nestjs/common";
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

  async single<T>(query: any): Promise<T> {
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

  /**
   * Reusable pagination helper for Supabase queries
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
}
