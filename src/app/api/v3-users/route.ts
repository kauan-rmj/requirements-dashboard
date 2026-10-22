import { NextResponse } from 'next/server';
import { sql, type V3User } from '@/lib/v3-tests';

export const dynamic = 'force-dynamic';

// Integration/bot accounts in Linear have these synthetic emails.
const isBot = (email: string) => /@(oauthapp|linear)\.linear\.app$/.test(email);

// Refresh the snapshot table from Linear; any failure falls back to the stored snapshot.
async function refreshFromLinear(apiKey: string) {
  const res = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: apiKey.replace(/^Bearer\s+/i, '') },
    body: JSON.stringify({
      query: `{ users(first: 250, filter: { active: { eq: true } }) { nodes { id name email avatarUrl } } }`,
    }),
    cache: 'no-store',
  });
  const nodes: { id: string; name: string; email: string; avatarUrl: string | null }[] | undefined = (await res.json())?.data?.users?.nodes;
  if (!nodes) throw new Error('Linear users query failed');
  const users = nodes.filter((u) => !isBot(u.email));
  const db = sql();
  await Promise.all(
    users.map(
      (u) => db`
        INSERT INTO v3_users (id, name, avatar_url) VALUES (${u.id}, ${u.name}, ${u.avatarUrl})
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url`,
    ),
  );
  await db`DELETE FROM v3_users WHERE id <> ALL(${users.map((u) => u.id)})`;
}

export async function GET() {
  try {
    const apiKey = process.env.LINEAR_API_KEY;
    if (apiKey) await refreshFromLinear(apiKey).catch(() => undefined);
    const users = (await sql()`SELECT id, name, avatar_url AS "avatarUrl" FROM v3_users ORDER BY name`) as V3User[];
    return NextResponse.json({ users });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
