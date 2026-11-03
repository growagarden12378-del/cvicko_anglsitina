import { neon } from '@neondatabase/serverless';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, '..', 'seed');
const sql = neon(process.env.DATABASE_URL);

const files = readdirSync(dir).filter((f) => f.endsWith('.json'));

const seen = [];
for (const file of files) {
  const data = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  const t = data.test;

  const [test] = await sql.query(
    `insert into tests (subject, year, variant, title, duration_min)
     values ($1, $2, $3, $4, $5)
     on conflict (subject, year, variant)
     do update set title = excluded.title, duration_min = excluded.duration_min
     returning id`,
    [t.subject, t.year, t.variant ?? 'A', t.title ?? null, t.duration_min ?? null]
  );

  seen.push([t.subject, t.year, t.variant ?? 'A'].join('|'));
  // ukážky/zadania sa pri každom seede vytvoria nanovo
  await sql.query('delete from passages where test_id = $1', [test.id]);
  const passageIds = {};
  for (const [idx, p] of (data.passages ?? []).entries()) {
    const [row] = await sql.query(
      'insert into passages (test_id, title, body, image_url, sort) values ($1, $2, $3, $4, $5) returning id',
      [test.id, p.title ?? null, p.body ?? null, p.image_url ?? null, idx]
    );
    passageIds[p.key] = row.id;
  }

  for (const q of data.questions) {
    await sql.query(
      `insert into questions
         (test_id, passage_id, number, kind, topic, prompt, image_url, options, correct, accepted, explanation, verified)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       on conflict (test_id, number) do update set
         passage_id = excluded.passage_id, kind = excluded.kind, topic = excluded.topic,
         prompt = excluded.prompt, image_url = excluded.image_url, options = excluded.options,
         correct = excluded.correct, accepted = excluded.accepted,
         explanation = excluded.explanation, verified = excluded.verified`,
      [
        test.id,
        q.passage ? passageIds[q.passage] ?? null : null,
        q.number,
        q.kind,
        q.topic,
        q.prompt,
        q.image_url ?? null,
        q.options ? JSON.stringify(q.options) : null,
        String(q.correct),
        JSON.stringify(q.accepted ?? []),
        q.explanation ?? null,
        q.verified ?? false,
      ]
    );
  }
  // úlohy, ktoré už v súbore nie sú, zmaž
  await sql.query('delete from questions where test_id = $1 and number <> all($2::int[])', [
    test.id,
    data.questions.map((q) => q.number),
  ]);
  console.log(`${file}: ${data.questions.length} úloh`);
}

// testy, ktoré už nemajú súbor, zmaž (aj s úlohami)
await sql.query("delete from tests where subject = any($1::text[]) and (subject || '|' || year || '|' || variant) <> all($2::text[])", [[...new Set(seen.map((x) => x.split('|')[0]))], seen]);
