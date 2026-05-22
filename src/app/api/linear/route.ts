import { NextResponse } from 'next/server';
import { fetchLinearData } from '@/lib/linear';

export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'LINEAR_API_KEY not set' }, { status: 500 });
  }
  try {
    const data = await fetchLinearData(apiKey);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
