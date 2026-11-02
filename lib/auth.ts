import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';

export const COOKIE = 'tm9_session';
const MAX_AGE = 60 * 60 * 24 * 90; // 90 dní

export function hashPassword(pw: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(pw, salt, 64);
  return `${salt.toString('hex')}:${key.toString('hex')}`;
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [saltHex, keyHex] = stored.split(':');
  if (!saltHex || !keyHex) return false;
  const key = scryptSync(pw, Buffer.from(saltHex, 'hex'), 64);
  const want = Buffer.from(keyHex, 'hex');
  return key.length === want.length && timingSafeEqual(key, want);
}

const sha = (s: string) => createHash('sha256').update(s).digest('hex');

export async function startSession(userId: number) {
  const token = randomBytes(32).toString('hex');
  await query('insert into sessions (token_hash, user_id) values ($1, $2)', [sha(token), userId]);
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  const token = cookies().get(COOKIE)?.value;
  if (token) await query('delete from sessions where token_hash = $1', [sha(token)]);
  cookies().set(COOKIE, '', { path: '/', maxAge: 0 });
}

export async function currentUser(): Promise<{ id: number; username: string } | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  const rows = await query<{ id: number; username: string }>(
    `select u.id, u.username from sessions s join users u on u.id = s.user_id
      where s.token_hash = $1 and s.created_at > now() - interval '90 days'`,
    [sha(token)]
  );
  return rows[0] ?? null;
}
