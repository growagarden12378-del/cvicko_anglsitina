'use client';

import { useEffect, useState } from 'react';

import { itemById } from '@/lib/shop';

type Row = { username: string; score: number; badge?: string | null };
type Mine = { rank: number; score: number } | null;
type Data = { me: string | null; total: Row[]; week: Row[]; myTotal: Mine; myWeek: Mine };

export default function Leaderboard() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'week' | 'total'>('week');

  useEffect(() => {
    fetch('/api/leaderboard', { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setData)
      .catch(() => setError('Rebríček sa nepodarilo načítať. Skús to neskôr.'));
  }, []);

  const rows = data ? (tab === 'week' ? data.week : data.total) : [];
  const mine = data ? (tab === 'week' ? data.myWeek : data.myTotal) : null;
  const unit = tab === 'week' ? 'úloh' : 'XP';
  const medal = (i: number) => ['🥇', '🥈', '🥉'][i] ?? `${i + 1}.`;

  return (
    <main>
      <header className="top">
        <div>
          <h1 className="brand__name">Rebríček</h1>
          <p className="brand__tag">Najlepší žiaci na Cvičku Angličtina</p>
        </div>
        <a className="acct__btn" href="/anglictina">← Späť na cvičenie</a>
      </header>

      <div className="seg lb__tabs" role="tablist">
        <button type="button" className={'seg__btn' + (tab === 'week' ? ' seg__btn--on' : '')} onClick={() => setTab('week')}>Tento týždeň</button>
        <button type="button" className={'seg__btn' + (tab === 'total' ? ' seg__btn--on' : '')} onClick={() => setTab('total')}>Celkovo</button>
      </div>
      <p className="lb__hint">
        {tab === 'week'
          ? 'Počet vyriešených úloh za posledných 7 dní.'
          : 'Celkový počet bodov XP.'}
      </p>

      {error && <p className="modal__err">{error}</p>}
      {!data && !error && <p className="lb__hint">Načítavam…</p>}

      {data && (
        <ol className="lb">
          {rows.length === 0 && <li className="lb__empty">Zatiaľ tu nikto nie je. Buď prvý!</li>}
          {rows.map((r, i) => (
            <li key={r.username} className={'lb__row' + (r.username === data.me ? ' lb__row--me' : '')}>
              <span className="lb__pos">{medal(i)}</span>
              <span className="lb__name">{r.badge ? (itemById(r.badge)?.emoji ?? '') + ' ' : ''}{r.username}</span>
              <span className="lb__score">{r.score} {unit}</span>
            </li>
          ))}
        </ol>
      )}

      {data && data.me && mine && !rows.some((r) => r.username === data.me) && (
        <p className="lb__mine">Tvoje miesto: <b>{mine.rank}.</b> ({mine.score} {unit})</p>
      )}
      {data && !data.me && (
        <p className="lb__hint">Chceš sa dostať do rebríčka? <a href="/anglictina">Vytvor si účet</a> na hlavnej stránke.</p>
      )}
      <p className="lb__hint">V rebríčku sa zobrazuje tvoje používateľské meno, nepoužívaj preto svoje celé meno.</p>
    </main>
  );
}
