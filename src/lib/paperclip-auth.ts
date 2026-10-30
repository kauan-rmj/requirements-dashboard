import 'server-only';
import { neon } from '@neondatabase/serverless';
import { createHmac, scryptSync, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'paperclip_session';
export const SESSION_TTL_SECONDS = 12 * 60 * 60;

const EMAIL_RE = /^[a-z0-9._%+-]+@tolky\.to$/;

const sql = () => neon(process.env.DATABASE_URL!);

async function getConfig(key: string): Promise<string | null> {
  const rows = await sql()`SELECT value FROM paperclip_config WHERE key = ${key}`;
  return (rows[0]?.value as string | undefined) ?? null;
}

const sign = (payload: string, secret: string) =>
  createHmac('sha256', secret).update(payload).digest('base64url');

export async function verifyLogin(email: string, password: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  const stored = await getConfig('password_hash');
  if (!stored) return false;
  const [salt, hash] = stored.split(':');
  const expected = Buffer.from(hash, 'hex');
  const actual = scryptSync(password, salt, expected.length);
  const passwordOk = timingSafeEqual(actual, expected);
  return passwordOk && EMAIL_RE.test(normalized);
}

export async function createSessionToken(email: string): Promise<string> {
  const secret = await getConfig('session_secret');
  if (!secret) throw new Error('missing session secret');
  const payload = Buffer.from(
    JSON.stringify({ e: email.trim().toLowerCase(), x: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS }),
  ).toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

export async function getSessionEmail(): Promise<string | null> {
  try {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;
    const secret = await getConfig('session_secret');
    if (!secret) return null;
    const expected = Buffer.from(sign(payload, secret));
    const given = Buffer.from(signature);
    if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
    const { e, x } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (typeof e !== 'string' || typeof x !== 'number' || x < Date.now() / 1000) return null;
    return EMAIL_RE.test(e) ? e : null;
  } catch {
    return null;
  }
}

export async function getDoc(name: string): Promise<string | null> {
  if (!(await getSessionEmail())) return null;
  try {
    const rows = await sql()`SELECT content FROM paperclip_docs WHERE name = ${name}`;
    return (rows[0]?.content as string | undefined) ?? null;
  } catch {
    return null;
  }
}
