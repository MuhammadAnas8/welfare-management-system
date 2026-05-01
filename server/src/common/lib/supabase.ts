import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/app.config';

let serviceRoleClient: SupabaseClient | null = null;
let anonClient: SupabaseClient | null = null;

function createSupabaseClient(key: string): SupabaseClient {
  return createClient(config.supabase.url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function getSupabaseServiceRoleClient(): SupabaseClient {
  if (!serviceRoleClient) {
    serviceRoleClient = createSupabaseClient(
      config.supabase.serviceRoleKey,
    );
  }
  return serviceRoleClient;
}

export function getSupabaseAnonClient(): SupabaseClient {
  if (!anonClient) {
    anonClient = createSupabaseClient(
      config.supabase.anonKey,
    );
  }
  return anonClient;
}