import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { AuthUser } from '@/types';

export function getAuthUser(req: NextRequest): AuthUser | null {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function requireAuth(req: NextRequest): { user: AuthUser } | { error: string; status: number } {
  const user = getAuthUser(req);
  if (!user) return { error: 'Unauthorized', status: 401 };
  return { user };
}

export function requireAdmin(req: NextRequest): { user: AuthUser } | { error: string; status: number } {
  const user = getAuthUser(req);
  if (!user) return { error: 'Unauthorized', status: 401 };
  if (user.role !== 'admin') return { error: 'Forbidden: Admin access required', status: 403 };
  return { user };
}
