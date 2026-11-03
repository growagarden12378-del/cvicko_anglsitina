'use client';

import { type FormEvent, useEffect, useRef, useState } from 'react';
import { itemById } from '@/lib/shop';

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="8" r="4.2" fill="#3b82f6" />
      <path d="M3.8 21c0-4.6 3.7-7.6 8.2-7.6s8.2 3 8.2 7.6z" fill="#3b82f6" />
    </svg>
  );
}

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
  const [menu, setMenu] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setMenu(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [menu]);

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
      <div className="acct acct--icon" ref={boxRef}>
        <button
          type="button"
          className="iconbtn"
          aria-label={`Účet: ${user.username}`}
          aria-haspopup="true"
          aria-expanded={menu}
          onClick={() => setMenu((v) => !v)}
        >
          <PersonIcon />
        </button>
        {menu && (
          <div className="acct__menu" role="menu">
            <span className="acct__who">
              <b>{badgeEmoji(badge)}{user.username}</b>
              <small>{syncing ? 'ukladám…' : 'postup uložený ✓'}</small>
            </span>
            <button
              type="button"
              className="acct__btn"
              role="menuitem"
              onClick={() => {
                setMenu(false);
                onLogout();
              }}
            >
              Odhlásiť
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="acct acct--icon">
      <button type="button" className="iconbtn" aria-label="Prihlásiť sa / Vytvoriť účet" onClick={() => setOpen(true)}>
        <PersonIcon />
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
