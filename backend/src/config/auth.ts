import jwt from 'jsonwebtoken';
import { AuthPayload } from '../types/auth';

export const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'access-dev-secret';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'refresh-dev-secret';

export function createAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: '15m' });
}

export function createRefreshToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '14d' });
}

export function getCorsOrigins(): string[] {
  return (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
