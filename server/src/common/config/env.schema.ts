import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  PORT: z.coerce.number().default(3001),

  SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_JWT_SECRET: z.string().min(1),

  CORS_ORIGIN: z.url(),


});

export type Env = z.infer<typeof envSchema>;