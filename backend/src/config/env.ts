import dotenv from 'dotenv';
dotenv.config();

const required = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
};

export const env = {
  PORT:         parseInt(process.env.PORT || '5000', 10),
  NODE_ENV:     process.env.NODE_ENV || 'development',
  MONGODB_URI:  required('MONGODB_URI'),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
} as const;