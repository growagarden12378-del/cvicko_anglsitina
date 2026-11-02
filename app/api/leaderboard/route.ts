import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

type Row = { username: string; score: number; badge?: string | null };

export async function GET() {
  const me = await currentUser();

  const total = await query<Row>(
    `select username, progress->'equipped'->>'badge' as badge, coalesce((progress->>'xp')::numeric, 0)::int as score
       from users
      where coalesce((progress->>'xp')::numeric, 0) > 0
      order by score desc, id
      limit 20`
  );
  // úlohy vyriešené za posledných 7 dní (dnes + 6 predchádzajúcich)
  const week = await query<Row>(
    `select u.username, u.progress->'equipped'->>'badge' as badge, sum(v.value::numeric)::int as score
       from users u, jsonb_each_text(u.progress->'days') v
      where v.key >= to_char(current_date - 6, 'YYYY-MM-DD')
      group by u.id, u.username, u.progress->'equipped'->>'badge'
     having sum(v.value::numeric) > 0
      order by score desc, u.id
      limit 20`
  );

  let myTotal: { rank: number; score: number } | null = null;
  let myWeek: { rank: number; score: number } | null = null;
  if (me) {
    const [t] = await query<{ score: number; rank: number }>(
      `select coalesce((progress->>'xp')::numeric, 0)::int as score,
              (select count(*) + 1 from users o
                where coalesce((o.progress->>'xp')::numeric, 0) > coalesce((u.progress->>'xp')::numeric, 0))::int as rank
         from users u where u.id = $1`,
      [me.id]
    );
    if (t && t.score > 0) myTotal = t;
    const [w] = await query<{ score: number; rank: number }>(
      `with s as (
         select u.id, sum(v.value::numeric) as n
           from users u, jsonb_each_text(u.progress->'days') v
          where v.key >= to_char(current_date - 6, 'YYYY-MM-DD')
          group by u.id)
       select n::int as score, (select count(*) + 1 from s o where o.n > s.n)::int as rank
         from s where id = $1`,
      [me.id]
    );
    if (w && w.score > 0) myWeek = w;
  }

  return NextResponse.json({ me: me?.username ?? null, total, week, myTotal, myWeek });
}
