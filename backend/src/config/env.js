import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  API_URL: z.string().url().default('http://localhost:3000'),
  CORS_ORIGIN: z.string().default('*'),
  SUPABASE_URL: z.string().url(),
  // Either the legacy anon key or the new publishable key works (see lib/supabase.js).
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default(''),
  DATABASE_URL: z.string().min(1),
  // Only used by Prisma migrations, not at runtime. Optional so the API can boot
  // without it (the session pooler 5432 is not available on this project).
  DIRECT_URL: z.string().min(1).optional(),
  // AI / RAG (optional: services degrade to mock/no-RAG when absent).
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().default('deepseek/deepseek-chat'),
  EMBED_MODEL: z.string().default('nvidia/llama-nemotron-embed-vl-1b-v2:free'),
}).refine((env) => env.SUPABASE_ANON_KEY || env.SUPABASE_PUBLISHABLE_KEY, {
  message: 'SUPABASE_ANON_KEY or SUPABASE_PUBLISHABLE_KEY is required',
  path: ['SUPABASE_ANON_KEY'],
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const missing = parsed.error.issues.map((i) => `  • ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(`Invalid environment variables:\n${missing}`);
}

export const env = parsed.data;
