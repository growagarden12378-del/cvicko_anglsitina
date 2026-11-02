import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { currentUser, endSession, hashPassword, startSession, verifyPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ user: await currentUser() });
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Neplatná požiadavka.' }, { status: 400 });
  }
  const action = body?.action;

  if (action === 'logout') {
    await endSession();
    return NextResponse.json({ user: null });
  }

  const username = String(body?.username ?? '').trim().toLowerCase();
  const password = String(body?.password ?? '');
  if (!/^[a-z0-9_.-]{3,24}$/.test(username)) {
    return NextResponse.json(
      { error: 'Meno musí mať 3 až 24 znakov: písmená bez diakritiky, číslice, bodku, pomlčku alebo podčiarkovník.' },
      { status: 400 }
    );
  }
  if (password.length < 6 || password.length > 100) {
    return NextResponse.json({ error: 'Heslo musí mať aspoň 6 znakov.' }, { status: 400 });
  }

  if (action === 'register') {
    const rows = await query<{ id: number }>(
      'insert into users (username, pass_hash) values ($1, $2) on conflict (username) do nothing returning id',
      [username, hashPassword(password)]
    );
    if (!rows.length) return NextResponse.json({ error: 'Toto meno je už obsadené.' }, { status: 409 });
    await startSession(rows[0].id);
    return NextResponse.json({ user: { id: rows[0].id, username } });
  }

  if (action === 'login') {
    const rows = await query<{ id: number; pass_hash: string }>(
      'select id, pass_hash from users where username = $1',
      [username]
    );
    if (!rows.length || !verifyPassword(password, rows[0].pass_hash)) {
      return NextResponse.json({ error: 'Nesprávne meno alebo heslo.' }, { status: 401 });
    }
    await startSession(rows[0].id);
    return NextResponse.json({ user: { id: rows[0].id, username } });
  }

  return NextResponse.json({ error: 'Neznáma akcia.' }, { status: 400 });
}
