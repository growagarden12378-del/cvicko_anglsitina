'use client';

import { useEffect } from 'react';
import { ITEMS, type Item, type ItemKind } from '@/lib/shop';
import { type Progress, candyBalance } from '@/lib/progress';

type Props = {
  prog: Progress;
  earning: boolean; // prebieha Halloween, cukríky sa dajú zarábať
  onBuy: (id: string) => void;
  onEquip: (id: string) => void;
  onClose: () => void;
};

const GROUPS: { kind: ItemKind; title: string; hint: string }[] = [
  { kind: 'badge', title: 'Odznaky', hint: 'Zobrazia sa pri tvojom mene a v rebríčku. Nasadiť môžeš jeden.' },
  { kind: 'fx', title: 'Efekty stránky', hint: 'Mení vzhľad stránky. Nasadiť môžeš jeden.' },
  { kind: 'boost', title: 'Bonus', hint: 'Platí hneď po kúpe.' },
];

export default function Shop({ prog, earning, onBuy, onEquip, onClose }: Props) {
  const balance = candyBalance(prog);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  function action(it: Item) {
    const owned = prog.items.includes(it.id);
    if (!owned) {
      const can = balance >= it.price;
      return (
        <button type="button" className="btn btn--primary shop__btn" disabled={!can} onClick={() => onBuy(it.id)}>
          {can ? `Kúpiť za ${it.price} 🍬` : `Chýba ${it.price - balance} 🍬`}
        </button>
      );
    }
    if (it.kind === 'boost') return <span className="shop__owned">Máš ✓ (aktívny)</span>;
    const on = prog.equipped[it.kind === 'badge' ? 'badge' : 'fx'] === it.id;
    return (
      <button type="button" className={'btn shop__btn ' + (on ? 'btn--primary' : 'btn--ghost')} onClick={() => onEquip(it.id)}>
        {on ? 'Nasadené ✓ (zložiť)' : 'Nasadiť'}
      </button>
    );
  }

  return (
    <div className="shop" role="dialog" aria-modal="true" aria-label="Halloween obchod">
      <div className="shop__inner">
        <header className="shop__top">
          <div>
            <h2 className="shop__title">Halloween obchod</h2>
            <p className="shop__sub">
              {earning
                ? 'Za každú správnu odpoveď dostaneš 3 🍬 (v sérii a za opravenú chybu viac).'
                : 'Zbieranie cukríkov skončilo, ale čo si kúpil, ti ostáva.'}
            </p>
          </div>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Zavrieť</button>
        </header>

        <p className="shop__balance" aria-live="polite">Máš <b>{balance} 🍬</b></p>

        {GROUPS.map((g) => (
          <section key={g.kind} className="shop__group">
            <h3 className="shop__gtitle">{g.title}</h3>
            <p className="shop__hint">{g.hint}</p>
            <div className="shop__grid">
              {ITEMS.filter((i) => i.kind === g.kind).map((it) => (
                <article key={it.id} className={'shop__item' + (prog.items.includes(it.id) ? ' shop__item--owned' : '')}>
                  <span className="shop__emoji" aria-hidden="true">{it.emoji}</span>
                  <h4 className="shop__name">{it.name}</h4>
                  <p className="shop__desc">{it.desc}</p>
                  {action(it)}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

// Efekty stránky (pavučiny, dážď cukríkov), ktoré si hráč nasadil.
export function Fx({ fx }: { fx?: string }) {
  if (fx === 'webs') {
    const web = (
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
          <path d="M0 0 L100 0 M0 0 L0 100 M0 0 L85 55 M0 0 L55 85 M0 0 L98 25 M0 0 L25 98" />
          <path d="M18 0 Q14 14 0 18 M36 0 Q28 28 0 36 M56 0 Q44 44 0 56 M78 0 Q60 60 0 78" />
        </g>
      </svg>
    );
    return (
      <div className="fx fx--webs" aria-hidden="true">
        <span className="web web--l">{web}</span>
        <span className="web web--r">{web}</span>
      </div>
    );
  }
  if (fx === 'candyrain') {
    const bits = ['🍬', '🍭', '🍫', '🍬', '🍭', '🍫', '🍬', '🍭'];
    return (
      <div className="fx fx--rain" aria-hidden="true">
        {bits.map((b, i) => (
          <span key={i} style={{ left: `${6 + i * 12}%`, animationDelay: `${(i * 1.7) % 9}s`, animationDuration: `${9 + (i % 4) * 2}s` }}>{b}</span>
        ))}
      </div>
    );
  }
  return null;
}
