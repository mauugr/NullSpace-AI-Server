import 'dotenv/config';

const required = ['DATABASE_URL', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
}
if ((process.env.JWT_SECRET || '').length < 32) {
  throw new Error('JWT_SECRET must contain at least 32 characters');
}

export const env = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
  aiProvider: process.env.AI_PROVIDER || 'openai',
  ollamaBaseUrl: (process.env.OLLAMA_BASE_URL || '').replace(/\/$/, ''),
  ollamaModel: process.env.OLLAMA_MODEL || 'llama3.2',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',').map(v => v.trim()).filter(Boolean),
  trustProxy: Number(process.env.TRUST_PROXY || 1)
};
