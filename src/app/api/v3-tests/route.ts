import { NextResponse } from 'next/server';
import { sql, isV3Status } from '@/lib/v3-tests';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = await sql()`SELECT id::int AS id, milestone, feature, test, status, assignee_id AS "assigneeId" FROM v3_tests ORDER BY position, id`;
    return NextResponse.json({ tests: rows });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const status = isV3Status(b.status) ? b.status : 'validacao_pendente';
    const rows = await sql()`
      INSERT INTO v3_tests (milestone, feature, test, status, assignee_id, position)
      VALUES (${String(b.milestone ?? '')}, ${String(b.feature ?? '')}, ${String(b.test ?? '')}, ${status}, ${b.assigneeId || null},
              (SELECT COALESCE(MAX(position), 0) + 1 FROM v3_tests))
      RETURNING id::int AS id, milestone, feature, test, status, assignee_id AS "assigneeId"`;
    return NextResponse.json({ test: rows[0] }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
