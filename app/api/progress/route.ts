import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { mergeForSave, sanitize } from '@/lib/progress';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Nie si prihlásený.' }, { status: 401 });
  const rows = await query<{ progress: unknown }>('select progress from users where id = $1', [user.id]);
  return NextResponse.json({ progress: sanitize(rows[0]?.progress) });
}

export async function PUT(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Nie si prihlásený.' }, { status: 401 });
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Neplatná požiadavka.' }, { status: 400 });
  }
  const client = sanitize(body?.progress);
  const rows = await query<{ progress: unknown }>('select progress from users where id = $1', [user.id]);
  const merged = mergeForSave(sanitize(rows[0]?.progress), client);
  await query('update users set progress = $1::jsonb where id = $2', [JSON.stringify(merged), user.id]);
  return NextResponse.json({ ok: true, progress: merged });
}
