'use client';

import { useEffect, useRef, useState } from 'react';
import { SITES } from '@/lib/config';

export default function Sites() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', down);
    document.addEventListener('touchstart', down);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', down);
      document.removeEventListener('touchstart', down);
      document.removeEventListener('keydown', key);
    };
  }, [open]);

  return (
    <div className="sites" ref={ref}>
      <button
        type="button"
        className="iconbtn"
        aria-label="Naše ďalšie stránky"
        title="Naše ďalšie stránky"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden="true">🌐</span>
      </button>
      {open && (
        <div className="sites__menu" role="menu">
          <b className="sites__title">Naše stránky</b>
          {SITES.map((s) => (
            <a key={s.url} className="sites__link" href={s.url} target="_blank" rel="noopener noreferrer" role="menuitem">
              <span className="sites__emoji" aria-hidden="true">{s.emoji}</span>
              <span>
                {s.name}
                <small>{s.desc}</small>
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
