import { NextResponse } from 'next/server';
import { sql, type V3Milestone } from '@/lib/v3-tests';

export const dynamic = 'force-dynamic';

const V3_PROJECT_ID = process.env.LINEAR_V3_PROJECT_ID ?? 'a26352fd-5853-4f9b-a9dd-db68e7166022';

// Refresh the snapshot table from Linear; any failure falls back to the stored snapshot.
async function refreshFromLinear(apiKey: string) {
  const res = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: apiKey.replace(/^Bearer\s+/i, '') },
    body: JSON.stringify({
      query: `query($id: String!) { project(id: $id) { url projectMilestones { nodes { id name sortOrder } } } }`,
      variables: { id: V3_PROJECT_ID },
    }),
    cache: 'no-store',
  });
  const json = await res.json();
  const project = json?.data?.project;
  if (!project) throw new Error('V3 project not found');
  const db = sql();
  const url = `${project.url}/overview`;
  const nodes: { id: string; name: string; sortOrder: number }[] = project.projectMilestones.nodes;
  await Promise.all(
    nodes.map(
      (m) => db`
        INSERT INTO v3_milestones (id, name, url, sort_order) VALUES (${m.id}, ${m.name}, ${url}, ${m.sortOrder})
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, url = EXCLUDED.url, sort_order = EXCLUDED.sort_order`,
    ),
  );
  await db`DELETE FROM v3_milestones WHERE id <> ALL(${nodes.map((m) => m.id)})`;
}

export async function GET() {
  try {
    const apiKey = process.env.LINEAR_API_KEY;
    if (apiKey) await refreshFromLinear(apiKey).catch(() => undefined);
    const rows = (await sql()`SELECT id, name, url FROM v3_milestones ORDER BY sort_order`) as V3Milestone[];
    return NextResponse.json({ milestones: rows });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
