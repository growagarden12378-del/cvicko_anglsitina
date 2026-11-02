'use client';

import { type FormEvent, useState } from 'react';
import { itemById } from '@/lib/shop';

const badgeEmoji = (id?: string) => (id ? (itemById(id)?.emoji ?? '') + ' ' : '');

export type User = { id: number; username: string };

type Props = {
  user: User | null;
  badge?: string;
  syncing: boolean;
  onAuth: (user: User) => void;
  onLogout: () => void;
};

export default function Account({ user, badge, syncing, onAuth, onLogout }: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: mode, username, password }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.user) {
        setError(d.error || 'Niečo sa pokazilo. Skús to znova.');
      } else {
        setOpen(false);
        setPassword('');
        onAuth(d.user);
      }
    } catch {
      setError('Nepodarilo sa spojiť so serverom. Skontroluj internet.');
    } finally {
      setBusy(false);
    }
  }

  if (user) {
    return (
      <div className="acct">
        <span className="acct__name">
          <b>{badgeEmoji(badge)}{user.username}</b>
          <small>{syncing ? 'ukladám…' : 'postup uložený ✓'}</small>
        </span>
        <button type="button" className="acct__btn" onClick={onLogout}>Odhlásiť</button>
      </div>
    );
  }

  return (
    <div className="acct">
      <button type="button" className="acct__btn acct__btn--main" onClick={() => setOpen(true)}>
        Prihlásiť sa / Vytvoriť účet
      </button>
      {open && (
        <div className="modal" role="dialog" aria-modal="true" aria-label="Účet" onClick={() => setOpen(false)}>
          <form className="modal__box" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
            <h2>{mode === 'login' ? 'Prihlásenie' : 'Nový účet'}</h2>
            <p className="modal__hint">
              Účet uchová tvoj postup, XP aj zošit chýb na každom zariadení. E-mail netreba.
            </p>
            <label>
              Meno
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                autoFocus
              />
            </label>
            <label>
              Heslo
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </label>
            {error && <p className="modal__err" role="alert">{error}</p>}
            {mode === 'register' && (
              <p className="modal__legal">
                Vytvorením účtu súhlasíš s <a href="/podmienky" target="_blank" rel="noopener noreferrer">podmienkami</a> a{' '}
                <a href="/ochrana-udajov" target="_blank" rel="noopener noreferrer">ochranou údajov</a>. Ak máš menej ako 16 rokov,
                potrebuješ súhlas rodiča. Ako prezývku nepoužívaj skutočné meno.
              </p>
            )}
            <button type="submit" className="acct__btn acct__btn--main" disabled={busy}>
              {busy ? 'Chvíľku…' : mode === 'login' ? 'Prihlásiť' : 'Vytvoriť účet'}
            </button>
            <button
              type="button"
              className="modal__link"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
              }}
            >
              {mode === 'login' ? 'Nemáš účet? Vytvor si ho' : 'Už máš účet? Prihlás sa'}
            </button>
            <button type="button" className="modal__link" onClick={() => setOpen(false)}>Zavrieť</button>
          </form>
        </div>
      )}
    </div>
  );
}
