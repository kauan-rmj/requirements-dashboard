import { NextResponse } from 'next/server';
import { fetchProjectMilestoneGroups } from '@/lib/linear';

export const dynamic = 'force-dynamic';

const V3_PROJECT_ID = process.env.LINEAR_V3_PROJECT_ID ?? 'a26352fd-5853-4f9b-a9dd-db68e7166022';

export async function GET() {
  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'LINEAR_API_KEY not set' }, { status: 500 });
  try {
    return NextResponse.json({ milestones: await fetchProjectMilestoneGroups(apiKey, V3_PROJECT_ID) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
