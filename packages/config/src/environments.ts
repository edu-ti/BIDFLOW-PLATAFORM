export const environments = {
  development: {
    NODE_ENV: 'development',
    API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    API_TIMEOUT: 30000,
    ENABLE_DEBUG: true,
  },
  production: {
    NODE_ENV: 'production',
    API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.bidflow.com',
    API_TIMEOUT: 15000,
    ENABLE_DEBUG: false,
  },
  test: {
    NODE_ENV: 'test',
    API_URL: 'http://localhost:3001',
    API_TIMEOUT: 5000,
    ENABLE_DEBUG: true,
  },
};

export type Environment = keyof typeof environments;

export function getEnvironment(): Environment {
  const env = process.env.NODE_ENV as string;
  return (env as Environment) || 'development';
}

export function getEnvConfig() {
  const currentEnv = getEnvironment();
  return environments[currentEnv];
}