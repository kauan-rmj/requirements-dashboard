'use server';

import { cookies } from 'next/headers';
import { SESSION_COOKIE, SESSION_TTL_SECONDS, createSessionToken, verifyLogin } from '@/lib/paperclip-auth';

export async function login(email: string, password: string): Promise<{ ok: boolean }> {
  try {
    if (typeof email !== 'string' || typeof password !== 'string' || !(await verifyLogin(email, password))) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      return { ok: false };
    }
    const token = await createSessionToken(email);
    (await cookies()).set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_TTL_SECONDS,
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
