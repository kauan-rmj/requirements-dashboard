import { NextResponse } from 'next/server';
import { sql, isV3Status } from '@/lib/v3-tests';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const id = Number((await params).id);
    const b = await req.json();
    if (b.status !== undefined && !isV3Status(b.status)) {
      return NextResponse.json({ error: 'invalid status' }, { status: 400 });
    }
    const rows = await sql()`
      UPDATE v3_tests SET
        milestone = COALESCE(${b.milestone ?? null}, milestone),
        feature = COALESCE(${b.feature ?? null}, feature),
        test = COALESCE(${b.test ?? null}, test),
        status = COALESCE(${b.status ?? null}, status),
        assignee_id = CASE WHEN ${'assigneeId' in b}::boolean THEN ${b.assigneeId || null} ELSE assignee_id END,
        validator_id = CASE WHEN ${'validatorId' in b}::boolean THEN ${b.validatorId || null} ELSE validator_id END,
        updated_at = now()
      WHERE id = ${id}
      RETURNING id::int AS id, milestone, feature, test, status, assignee_id AS "assigneeId", validator_id AS "validatorId"`;
    if (!rows.length) return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json({ test: rows[0] });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const id = Number((await params).id);
    await sql()`DELETE FROM v3_tests WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
