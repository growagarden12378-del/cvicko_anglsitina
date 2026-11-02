import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

const LABELS: Record<string, string> = {
  aj: 'Angličtina',
};

export async function GET() {
  const tests = await query(
    `select t.id, t.subject, t.year, t.variant, t.title, t.duration_min,
            (select count(*)::int from questions q where q.test_id = t.id) as n
       from tests t
      order by t.year desc, t.variant`
  );
  const topics = await query(
    `select t.subject, q.topic, count(*)::int as n
       from questions q join tests t on t.id = q.test_id
      group by t.subject, q.topic order by t.subject, q.topic`
  );

  const subjects: Record<string, any> = {};
  for (const key of Object.keys(LABELS)) {
    subjects[key] = {
      label: LABELS[key],
      topics: topics.filter((t: any) => t.subject === key).map((t: any) => ({ name: t.topic, n: t.n })),
      tests: tests.filter((t: any) => t.subject === key),
    };
  }
  return NextResponse.json({ subjects });
}
