import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isCorrect } from '@/lib/grade';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const answers: { id: number; answer: string }[] = Array.isArray(body?.answers) ? body.answers : [];
  const ids = answers.map((a) => Number(a.id)).filter(Number.isFinite);
  if (!ids.length) return NextResponse.json({ results: [] });

  const rows = await query(
    'select id, kind, correct, accepted, explanation, verified from questions where id = any($1::int[])',
    [ids]
  );
  const byId = new Map(rows.map((r: any) => [r.id, r]));

  const results = answers
    .filter((a) => byId.has(Number(a.id)))
    .map((a) => {
      const q: any = byId.get(Number(a.id));
      return {
        id: q.id,
        ok: isCorrect(q.kind, String(a.answer ?? ''), q.correct, q.accepted ?? []),
        correct: q.correct,
        explanation: q.explanation,
        verified: !!q.verified,
      };
    });
  return NextResponse.json({ results });
}
