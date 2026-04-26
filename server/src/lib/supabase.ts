import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let serviceRoleClient: SupabaseClient | null = null;
let anonClient: SupabaseClient | null = null;

function getRequiredEnv(name: 'SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY' | 'SUPABASE_ANON_KEY'): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not defined`);
  }

  return value;
}

function createSupabaseClient(key: string): SupabaseClient {
  const supabaseUrl = getRequiredEnv('SUPABASE_URL');

  return createClient(supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function getSupabaseServiceRoleClient(): SupabaseClient {
  if (!serviceRoleClient) {
    serviceRoleClient = createSupabaseClient(getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'));
  }

  return serviceRoleClient;
}

export function getSupabaseAnonClient(): SupabaseClient {
  if (!anonClient) {
    anonClient = createSupabaseClient(getRequiredEnv('SUPABASE_ANON_KEY'));
  }

  return anonClient;
}
