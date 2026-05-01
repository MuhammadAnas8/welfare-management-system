import { env } from "./env";

export const config = {
  app: {
    name: "Seri Welfare API Server",
    env: env.NODE_ENV,
    isDev: env.NODE_ENV === "development",
    isProd: env.NODE_ENV === "production",
    port: env.PORT,
  },

  supabase: {
    url: env.SUPABASE_URL,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    anonKey: env.SUPABASE_ANON_KEY, 
    jwtSecret: env.SUPABASE_JWT_SECRET,
  },

  cors: {
    origin: env.CORS_ORIGIN,
  },

} as const;