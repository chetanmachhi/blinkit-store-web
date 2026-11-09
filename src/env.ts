import { z } from "zod";

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url(),
  VITE_APP_NAME: z.string().default("Blinkit Store Partner"),
});

export type EnvConfig = z.infer<typeof envSchema>;

let parsedEnv: EnvConfig;
let envError: string | null = null;

try {
  parsedEnv = envSchema.parse({
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
  });
} catch (err: any) {
  envError = err instanceof z.ZodError
    ? err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")
    : "Invalid environment variables configuration";
  parsedEnv = {
    VITE_API_BASE_URL: "http://localhost:3000/api/v1/store",
    VITE_APP_NAME: "Blinkit Store Partner",
  };
}

export const env = parsedEnv;
export const configError = envError;
