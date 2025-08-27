import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const emptyToUndefined = z
  .string()
  .optional()
  .transform((v) => (v === "" ? undefined : v));

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    NEXTAUTH_SECRET: z.string().min(1),
    STRIPE_SECRET_KEY: emptyToUndefined,
    STRIPE_WEBHOOK_SECRET: emptyToUndefined,
    REPLICATE_API_TOKEN: emptyToUndefined,
    HUGGINGFACE_API_TOKEN: emptyToUndefined,
    SUPABASE_URL: emptyToUndefined.pipe(z.string().url().optional()),
    SUPABASE_ANON_KEY: emptyToUndefined,
    UPLOADTHING_TOKEN: emptyToUndefined,
    GOOGLE_CLIENT_ID: emptyToUndefined,
    GOOGLE_CLIENT_SECRET: emptyToUndefined,
    EMAIL_SERVER: emptyToUndefined,
    EMAIL_FROM: emptyToUndefined,
  },
  client: {
    NEXT_PUBLIC_APP_NAME: z.string().default("TREADS"),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  },
});

