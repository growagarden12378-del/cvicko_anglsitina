'use client';

import { Fragment, type CSSProperties, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type Progress, topicKey } from '@/lib/progress';
import { DOODLES, ENTRIES, type Entry, orderTopics } from '@/lib/journal';

type MetaSubject = { label: string; topics: { name: string; n: number }[] };
type MInfo = { id: number; subject: string; topic: string; prompt: string };
type Page = { t: 'toc-l' } | { t: 'toc-r' } | { t: 'tl'; name: string } | { t: 'tr'; name: string };

type Props = {
  meta: Record<string, MetaSubject>;
  prog: Progress;
  startSubject: string;
  startTopic?: string | null;
  onClose: () => void;
  onPracticeTopic: (subject: string, topic: string) => void;
  onPracticeIds: (ids: number[], label: string) => void;
};

const TAB_COLORS: Record<string, string> = { aj: '#2f6fed' };
const FLIP_MS = 760;

const FALLBACK: Entry = {
  hook: 'Táto strana je zatiaľ prázdna.',
  summary: 'K tejto téme ešte nemám zhrnutie. Precvič si ju a zapíš si, čo ti robí problémy.',
  rule: '',
  tips: [],
  doodle: 'oko',
};

function plural(n: number, one: string, few: string, many: string) {
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return few;
  return many;
}

// CSS premenné (--dl a pod.) pre štýl elementu
function cv(vars: Record<string, string>): CSSProperties {
  return vars as CSSProperties;
}

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Text, ktorý sa „napíše" slovo po slove (animáciu spúšťa trieda jpage--anim).
function Ink({ text, delay = 0, step = 0.03 }: { text: string; delay?: number; step?: number }) {
  const words = text.split(' ');
  return (
    <>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="jw" style={cv({ '--dl': `${(delay + i * step).toFixed(2)}s` })}>
            {w}
          </span>{' '}
        </Fragment>
      ))}
    </>
  );
}

function Doodle({ name, seen, delay = 0.2 }: { name: string; seen: boolean; delay?: number }) {
  const strokes = DOODLES[name] ?? DOODLES.oko;
  return (
    <div className={'jdoodle' + (seen ? '' : ' jdoodle--new')} aria-hidden="true">
      <span className="jsmudge" />
      <svg viewBox="0 0 100 100" className="jdoodle__svg">
        {strokes.map((s, i) => (
          <path
            key={i}
            d={s.d}
            pathLength={1}
            className={'jstroke' + (s.c ? ` jstroke--${s.c}` : '')}
            style={cv({ '--dl': `${(delay + i * 0.28).toFixed(2)}s` })}
          />
        ))}
      </svg>
    </div>
  );
}

function IconPencil() {
  return (
    <svg viewBox="0 0 24 24" className="jicon" aria-hidden="true">
      <path d="M4 20 L5.5 15 L16 4.5 L19.5 8 L9 18.5 Z M14 6.5 L17.5 10" />
    </svg>
  );
}
function IconCross() {
  return (
    <svg viewBox="0 0 24 24" className="jicon jicon--red" aria-hidden="true">
      <path d="M5 5 L19 19 M19 5 L5 19" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" className="jicon jicon--teal" aria-hidden="true">
      <path d="M4 13 L10 19 L20 5" />
    </svg>
  );
}

export default function Journal({ meta, prog, startSubject, startTopic, onClose, onPracticeTopic, onPracticeIds }: Props) {
  const subjects = useMemo(() => Object.keys(meta).filter((k) => meta[k].topics.length > 0), [meta]);
  const [subject, setSubject] = useState(subjects.includes(startSubject) ? startSubject : subjects[0] ?? 'aj');
  const [cols, setCols] = useState<1 | 2>(() =>
    typeof window !== 'undefined' && window.matchMedia('(min-width: 860px)').matches ? 2 : 1
  );
  // Ak zápisník otvoríme z upozornenia na novú chybu, začne na strane tej témy.
  const startPos = (() => {
    if (!startTopic) return 0;
    const sub = subjects.includes(startSubject) ? startSubject : subjects[0] ?? 'aj';
    const idx = orderTopics(sub, meta[sub]?.topics.map((t) => t.name) ?? []).indexOf(startTopic);
    if (idx < 0) return 0;
    const two = typeof window !== 'undefined' && window.matchMedia('(min-width: 860px)').matches;
    return 2 + 2 * idx + (two ? 0 : 1);
  })();
  const [pos, setPos] = useState(startPos);
  const [flip, setFlip] = useState<null | { dir: 'fwd' | 'back'; from: number; to: number }>(null);
  const [animSet, setAnimSet] = useState<Set<number>>(new Set([startPos, startPos + 1]));

  // ---------- chyby z databázy (podľa ID z postupu) ----------
  const [minfo, setMinfo] = useState<MInfo[]>([]);
  const [mstate, setMstate] = useState<'loading' | 'ok' | 'err'>('loading');
  const mistakeIds = useMemo(() => Object.keys(prog.mistakes).map(Number).filter(Boolean), [prog.mistakes]);
  const idsKey = mistakeIds.slice().sort((a, b) => a - b).join(',');

  useEffect(() => {
    if (!idsKey) {
      setMinfo([]);
      setMstate('ok');
      return;
    }
    let dead = false;
    setMstate('loading');
    fetch('/api/questions?ids=' + idsKey.split(',').slice(0, 100).join(','))
      .then((r) => {
        if (!r.ok) throw new Error('q');
        return r.json();
      })
      .then((d) => {
        if (dead) return;
        setMinfo((d.questions ?? []).map((q: any) => ({ id: q.id, subject: q.subject, topic: q.topic, prompt: String(q.prompt ?? '') })));
        setMstate('ok');
      })
      .catch(() => {
        if (!dead) setMstate('err');
      });
    return () => {
      dead = true;
    };
  }, [idsKey]);

  // ---------- stránky ----------
  const topics = useMemo(() => orderTopics(subject, meta[subject]?.topics.map((t) => t.name) ?? []), [meta, subject]);
  const pages = useMemo<Page[]>(() => {
    const p: Page[] = [{ t: 'toc-l' }, { t: 'toc-r' }];
    for (const name of topics) p.push({ t: 'tl', name }, { t: 'tr', name });
    return p;
  }, [topics]);
  const last = pages.length - 1;

  const stat = useCallback(
    (name: string) => {
      const st = prog.topics[topicKey(subject, name)];
      const a = st?.a ?? 0;
      const c = st?.c ?? 0;
      const pct = a ? Math.round((100 * c) / a) : null;
      return { a, c, pct, mastered: a >= 3 && (pct ?? 0) >= 80 };
    },
    [prog.topics, subject]
  );
  const mistakesOf = useCallback((name: string) => minfo.filter((m) => m.subject === subject && m.topic === name), [minfo, subject]);

  // ---------- listovanie ----------
  const stateRef = useRef({ pos, flip, cols, last });
  stateRef.current = { pos, flip, cols, last };
  const doneRef = useRef(false);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    const f = stateRef.current.flip;
    if (f) setPos(f.to);
    setFlip(null);
  }, []);

  const goTo = useCallback((target: number) => {
    const s = stateRef.current;
    if (s.flip) return;
    let t = Math.max(0, Math.min(s.last, target));
    if (s.cols === 2) t -= t % 2;
    if (t === s.pos) return;
    if (reduced()) {
      setPos(t);
      setAnimSet(new Set(s.cols === 2 ? [t, t + 1] : [t]));
      return;
    }
    const dir = t > s.pos ? 'fwd' : 'back';
    const incoming = s.cols === 2 ? (dir === 'fwd' ? [t + 1] : [t]) : dir === 'fwd' ? [t] : [];
    doneRef.current = false;
    setAnimSet(new Set(incoming));
    setFlip({ dir, from: s.pos, to: t });
  }, []);

  useEffect(() => {
    if (!flip) return;
    const t = setTimeout(finish, FLIP_MS + 120);
    return () => clearTimeout(t);
  }, [flip, finish]);

  const nav = useCallback((delta: number) => goTo(stateRef.current.pos + delta * stateRef.current.cols), [goTo]);

  function selectSubject(s: string) {
    if (s === subject) return;
    setSubject(s);
    setFlip(null);
    setPos(0);
    setAnimSet(new Set([0, 1]));
  }

  // počet stĺpcov podľa šírky okna
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 860px)');
    const on = () => setCols(mq.matches ? 2 : 1);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  useEffect(() => {
    if (cols === 2 && pos % 2 === 1) setPos(pos - 1);
  }, [cols, pos]);

  // klávesnica, zamknutie posúvania, fokus
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') nav(1);
      else if (e.key === 'ArrowLeft') nav(-1);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [nav, onClose]);

  // potiahnutie prstom
  const down = useRef<{ x: number; y: number } | null>(null);

  // ---------- obsah strán ----------
  const total = topics.length;
  const mastered = topics.filter((n) => stat(n).mastered).length;
  const attempts = topics.reduce((s, n) => s + stat(n).a, 0);
  const correct = topics.reduce((s, n) => s + stat(n).c, 0);
  const accPct = attempts ? Math.round((100 * correct) / attempts) : null;
  const subjectMistakes = minfo.filter((m) => m.subject === subject);

  function renderPage(idx: number, animate: boolean) {
    const pg = pages[idx];
    const cls = 'jpage ' + (idx % 2 === 0 ? 'jpage--l' : 'jpage--r') + (animate ? ' jpage--anim' : '');
    if (!pg) return <div key={`pg-${idx}`} className={cls + ' jpage--blank'} />;
    const num = <span className="jnum">{idx + 1}</span>;

    if (pg.t === 'toc-l') {
      return (
        <div key={`pg-${idx}`} className={cls}>
          <h3 className="jtitle"><Ink text="Zápisník" /></h3>
          <p className="jhook"><Ink text={meta[subject]?.label ?? ''} delay={0.2} /></p>
          <ol className="jtoc">
            {topics.map((name, i) => {
              const st = stat(name);
              const mk = mistakesOf(name).length;
              return (
                <li key={name}>
                  <button className="jtoc__row" onClick={() => goTo(2 + 2 * i)} style={cv({ '--dl': `${(0.25 + i * 0.07).toFixed(2)}s` })}>
                    <span className="jtoc__n">{i + 1}.</span>
                    <span className="jtoc__name">{name}</span>
                    <span className={'jtoc__mark' + (mk ? ' jtoc__mark--red' : st.mastered ? ' jtoc__mark--teal' : '')}>
                      {mk ? `✗ ${mk}` : st.mastered ? '✓' : st.pct !== null ? `${st.pct} %` : 'nové'}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          {num}
        </div>
      );
    }

    if (pg.t === 'toc-r') {
      return (
        <div key={`pg-${idx}`} className={cls}>
          <h3 className="jtitle jtitle--sm"><Ink text="Tvoj postup" /></h3>
          <div className="jstats">
            <div><b>{attempts}</b><span>{plural(attempts, 'pokus', 'pokusy', 'pokusov')}</span></div>
            <div><b>{accPct === null ? '–' : `${accPct} %`}</b><span>správne</span></div>
            <div><b>{mastered}/{total}</b><span>zvládnuté témy</span></div>
          </div>
          <Doodle name="oko" seen={attempts > 0} />
          <p className="jrule"><Ink text={attempts ? 'Vidím každú tvoju chybu.' : 'Zatiaľ ťa nikto nevidel pracovať.'} delay={1} /></p>
          <p className="jbody">
            <Ink
              text={
                mstate === 'loading'
                  ? 'Listujem v zápiskoch…'
                  : subjectMistakes.length
                  ? `V zápisníku máš ${subjectMistakes.length} ${plural(subjectMistakes.length, 'chybu', 'chyby', 'chýb')} z tohto predmetu. Zmiznú, keď ich vyriešiš správne dvakrát po sebe.`
                  : 'Z tohto predmetu zatiaľ nemáš žiadne otvorené chyby. Cvič a zapíšu sa sem.'
              }
              delay={1.2}
              step={0.025}
            />
          </p>
          {mstate === 'err' && <p className="jwarn">Chyby sa nepodarilo načítať.</p>}
          <div className="jbtns">
            <button className="jbtn jbtn--red" disabled={!mistakeIds.length} onClick={() => onPracticeIds(mistakeIds, 'Zápisník chýb')}>
              Prejsť všetky chyby{mistakeIds.length ? ` (${mistakeIds.length})` : ''}
            </button>
          </div>
          <p className="jfoot">Listuj šípkami ← →, ťahaním alebo tlačidlami dole.</p>
          {num}
        </div>
      );
    }

    const name = pg.name;
    const e = ENTRIES[subject]?.[name] ?? FALLBACK;
    const st = stat(name);
    const mk = mistakesOf(name);

    if (pg.t === 'tl') {
      return (
        <div key={`pg-${idx}`} className={cls}>
          <div className="jstatrow">
            <span className="jchip"><IconPencil /> {st.a}</span>
            <span className="jchip"><IconCross /> {mk.length}</span>
            {st.mastered && <span className="jchip"><IconCheck /> zvládnuté</span>}
          </div>
          <h3 className="jtitle"><Ink text={name} /></h3>
          <span className="jscribble" aria-hidden="true" />
          <p className="jhook"><Ink text={e.hook} delay={0.35} step={0.04} /></p>
          <Doodle name={e.doodle} seen={st.a > 0} delay={0.5} />
          {e.rule && <p className="jrule"><Ink text={e.rule} delay={1.5} step={0.04} /></p>}
          <p className="jbody"><Ink text={e.summary} delay={1.9} step={0.022} /></p>
          {st.mastered && <span className="jstamp" aria-hidden="true">Zvládnuté</span>}
          {num}
        </div>
      );
    }

    return (
      <div key={`pg-${idx}`} className={cls}>
        <p className="jcont"><Ink text={`… ${name}, pokračovanie`} /></p>
        {e.tips.length > 0 && (
          <>
            <h4 className="jh"><Ink text="Čo si zapamätať" delay={0.1} /></h4>
            <ul className="jtips">
              {e.tips.map((t, i) => (
                <li key={i}><Ink text={t} delay={0.3 + i * 0.5} step={0.025} /></li>
              ))}
            </ul>
          </>
        )}
        {e.example && (
          <div className="jexample">
            <span className="jtape" aria-hidden="true" />
            <b>Príklad</b>
            <p><Ink text={e.example} delay={1.7} step={0.03} /></p>
          </div>
        )}
        <h4 className="jh jh--red"><Ink text="Moje chyby" delay={2.2} /></h4>
        {mstate === 'loading' ? (
          <p className="jmuted">Hľadám v zápiskoch…</p>
        ) : mstate === 'err' ? (
          <p className="jwarn">Chyby sa nepodarilo načítať.</p>
        ) : mk.length ? (
          <ul className="jmist">
            {mk.slice(0, 3).map((m) => (
              <li key={m.id}>
                <IconCross />
                <span>{m.prompt.replace(/\s+/g, ' ').slice(0, 82)}{m.prompt.length > 82 ? '…' : ''}</span>
              </li>
            ))}
            {mk.length > 3 && <li className="jmuted">…a ďalšie {mk.length - 3}</li>}
          </ul>
        ) : (
          <p className="jmuted">{st.a ? 'Tu je čisto. Dobrá práca.' : 'Zatiaľ tu nič nie je. Najprv si tému vyskúšaj.'}</p>
        )}
        <div className="jbtns">
          <button className="jbtn" onClick={() => onPracticeTopic(subject, name)}>Precvičiť tému</button>
          {mk.length > 0 && (
            <button className="jbtn jbtn--red" onClick={() => onPracticeIds(mk.map((m) => m.id), `Chyby: ${name}`)}>
              Opraviť chyby ({mk.length})
            </button>
          )}
        </div>
        {num}
      </div>
    );
  }

  // ---------- skladanie knihy ----------
  let slotL: ReactNode = null;
  let slotR: ReactNode = null;
  let leaf: ReactNode = null;
  const an = (i: number) => animSet.has(i);

  if (cols === 2) {
    if (!flip) {
      slotL = renderPage(pos, an(pos));
      slotR = renderPage(pos + 1, an(pos + 1));
    } else if (flip.dir === 'fwd') {
      slotL = renderPage(flip.from, false);
      slotR = renderPage(flip.to + 1, an(flip.to + 1));
      leaf = (
        <div className="jleaf jleaf--fwd" onAnimationEnd={(e) => e.target === e.currentTarget && finish()}>
          <div className="jface">{renderPage(flip.from + 1, false)}</div>
          <div className="jface jface--back">{renderPage(flip.to, false)}</div>
        </div>
      );
    } else {
      slotL = renderPage(flip.to, an(flip.to));
      slotR = renderPage(flip.from + 1, false);
      leaf = (
        <div className="jleaf jleaf--back" onAnimationEnd={(e) => e.target === e.currentTarget && finish()}>
          <div className="jface">{renderPage(flip.from, false)}</div>
          <div className="jface jface--back">{renderPage(flip.to + 1, false)}</div>
        </div>
      );
    }
  } else if (!flip) {
    slotL = renderPage(pos, an(pos));
  } else if (flip.dir === 'fwd') {
    slotL = renderPage(flip.to, an(flip.to));
    leaf = (
      <div className="jleaf jleaf--fwd1" onAnimationEnd={(e) => e.target === e.currentTarget && finish()}>
        <div className="jface">{renderPage(flip.from, false)}</div>
      </div>
    );
  } else {
    slotL = renderPage(flip.from, false);
    leaf = (
      <div className="jleaf jleaf--back1" onAnimationEnd={(e) => e.target === e.currentTarget && finish()}>
        <div className="jface">{renderPage(flip.to, false)}</div>
      </div>
    );
  }

  const shownEnd = Math.min(last, pos + cols - 1) + 1;
  const pageLabel = cols === 2 ? `${pos + 1}–${shownEnd} / ${last + 1}` : `${pos + 1} / ${last + 1}`;

  return (
    <div className="jover" role="dialog" aria-modal="true" aria-label="Zápisník">
      <button ref={closeRef} className="jclose" onClick={onClose} aria-label="Zavrieť zápisník (Esc)">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5 L19 19 M19 5 L5 19" /></svg>
      </button>

      <div className="jwrap">
        <div className="jtabs" role="tablist" aria-label="Predmet">
          {subjects.map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={s === subject}
              className={'jtab' + (s === subject ? ' jtab--on' : '')}
              style={cv({ '--tab': TAB_COLORS[s] ?? '#c9695a' })}
              onClick={() => selectSubject(s)}
            >
              {meta[s].label}
            </button>
          ))}
        </div>

        <div
          className={'jbook jbook--' + cols + (flip ? ' jbook--flip' : '')}
          onPointerDown={(e) => {
            down.current = { x: e.clientX, y: e.clientY };
          }}
          onPointerUp={(e) => {
            const d = down.current;
            down.current = null;
            if (!d) return;
            const dx = e.clientX - d.x;
            const dy = e.clientY - d.y;
            if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) nav(dx < 0 ? 1 : -1);
          }}
        >
          <div className="jslot jslot--l">{slotL}</div>
          {cols === 2 && <div className="jslot jslot--r">{slotR}</div>}
          {leaf}
          <div className="jspiral" aria-hidden="true">
            {Array.from({ length: 12 }, (_, i) => <i key={i} />)}
          </div>
        </div>

        <div className="jnav">
          <button className="jarrow" onClick={() => nav(-1)} disabled={pos === 0 || !!flip} aria-label="Predchádzajúca strana">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 L8 12 L15 19" /></svg>
          </button>
          <span className="jpagelabel">{pageLabel}</span>
          <button className="jarrow" onClick={() => nav(1)} disabled={pos + cols > last || !!flip} aria-label="Ďalšia strana">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5 L16 12 L9 19" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
