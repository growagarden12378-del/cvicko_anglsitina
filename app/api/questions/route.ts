import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const subject = sp.get('subject') ?? 'aj';
  const testId = Number(sp.get('test')) || null;
  const topics = (sp.get('topics') ?? '').split(',').map((t) => t.trim()).filter(Boolean);
  const ids = (sp.get('ids') ?? '')
    .split(',')
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, 100);
  const limit = Math.min(Number(sp.get('limit')) || 10, 100);

  const where: string[] = [];
  const params: unknown[] = [];

  if (ids.length) {
    // konkrétne úlohy (zošit chýb, oprava chýb) – predmet ani téma sa nefiltruje
    params.push(ids);
    where.push(`q.id = any($${params.length}::int[])`);
  } else {
    params.push(subject);
    where.push(`t.subject = $${params.length}`);
    if (testId) {
      params.push(testId);
      where.push(`q.test_id = $${params.length}`);
    }
    if (topics.length) {
      params.push(topics);
      where.push(`q.topic = any($${params.length}::text[])`);
    }
  }

  let tail = 'order by q.number';
  if (ids.length) {
    params.push(ids.length);
    tail = `order by random() limit $${params.length}`;
  } else if (!testId) {
    params.push(limit);
    tail = `order by random() limit $${params.length}`;
  }

  const rows = await query(
    `select q.id, q.number, q.kind, q.topic, q.prompt, q.image_url, q.options, t.subject, t.title as t_title,
            p.title as p_title, p.body as p_body, p.image_url as p_image
       from questions q
       join tests t on t.id = q.test_id
       left join passages p on p.id = q.passage_id
      where ${where.join(' and ')}
      ${tail}`,
    params
  );

  const questions = rows.map((r: any) => ({
    id: r.id,
    subject: r.subject,
    number: r.number,
    kind: r.kind,
    topic: r.topic,
    prompt: r.prompt,
    image_url: r.image_url,
    options: r.options,
    source: r.t_title ?? null,
    passage: r.p_title || r.p_body || r.p_image ? { title: r.p_title, body: r.p_body, image_url: r.p_image } : null,
  }));
  return NextResponse.json({ questions });
}
