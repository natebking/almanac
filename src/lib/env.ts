import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().optional().default(""),
  AUTH_MODE: z.enum(["alpha", "clerk"]).default("alpha"),
  ALMANAC_ALLOWED_EMAILS: z.string().optional().default(""),
  APP_URL: z.string().url().default("http://localhost:3000"),
  GOOGLE_MODE: z.enum(["local", "real"]).default("local"),
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),
  GOOGLE_REDIRECT_URI: z
    .string()
    .url()
    .default("http://localhost:3000/api/google/callback"),
  GOOGLE_OPTIONAL_DIAGNOSTICS: z
    .enum(["disabled", "enabled"])
    .default("disabled"),
  GOOGLE_TEST_ROOT_FOLDER_ID: z.string().optional().default(""),
  GOOGLE_MASTER_SPREADSHEET_ID: z.string().optional().default(""),
  GOOGLE_MASTER_SHEET_NAME: z.string().optional().default("Rentals"),
  OPENAI_API_KEY: z.string().optional().default(""),
  OPENAI_MODEL: z.string().optional().default("gpt-5.5"),
});

export type AppEnv = z.infer<typeof envSchema>;

export function getEnv(): AppEnv {
  return envSchema.parse(process.env);
}

export function hasGoogleOAuthConfig(env = getEnv()) {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}

export function hasOptionalGoogleDiagnostics(env = getEnv()) {
  return env.GOOGLE_OPTIONAL_DIAGNOSTICS === "enabled";
}

export function allowedUserEmails(env = getEnv()): string[] {
  return env.ALMANAC_ALLOWED_EMAILS.split(/[,\s]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function hasAllowedUserEmails(env = getEnv()) {
  return allowedUserEmails(env).length > 0;
}

export function isAllowedUserEmail(email: string | null | undefined, env = getEnv()) {
  if (!email) {
    return false;
  }

  return allowedUserEmails(env).includes(email.toLowerCase());
}
