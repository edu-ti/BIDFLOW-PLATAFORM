import { z } from 'zod';

export const appConfigSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  apiUrl: z.string().url().optional(),
  apiTimeout: z.number().min(1000).max(60000).default(30000),
  enableDebug: z.boolean().default(false),
});

export type AppConfig = z.infer<typeof appConfigSchema>;

export const databaseConfigSchema = z.object({
  url: z.string().url(),
  maxConnections: z.number().min(1).max(100).default(10),
  ssl: z.boolean().default(false),
});

export type DatabaseConfig = z.infer<typeof databaseConfigSchema>;

export const redisConfigSchema = z.object({
  host: z.string(),
  port: z.number().min(1).max(65535).default(6379),
  password: z.string().optional(),
  db: z.number().min(0).max(15).default(0),
});

export type RedisConfig = z.infer<typeof redisConfigSchema>;

export const authConfigSchema = z.object({
  jwtSecret: z.string().min(32),
  jwtExpiresIn: z.string().default('7d'),
  refreshTokenExpiresIn: z.string().default('30d'),
});

export type AuthConfig = z.infer<typeof authConfigSchema>;

export const corsConfigSchema = z.object({
  origin: z.array(z.string().url()).default(['http://localhost:3000']),
  credentials: z.boolean().default(true),
});

export type CorsConfig = z.infer<typeof corsConfigSchema>;

export const config = {
  app: appConfigSchema,
  database: databaseConfigSchema,
  redis: redisConfigSchema,
  auth: authConfigSchema,
  cors: corsConfigSchema,
};

export default config;