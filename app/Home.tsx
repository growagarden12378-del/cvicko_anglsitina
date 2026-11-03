'use client';

import { type ComponentProps, useEffect, useMemo, useRef, useState } from 'react';
import LevelGate from './Placement';
import { LEVELS, clearLevel, readLevel } from '@/lib/level';
import Journal from './Journal';
import Sites from './Sites';
import Account, { type User } from './Account';
import Support from './Support';
import Consent from './Consent';
import Shop, { Fx } from './Shop';
import { EVENT_END_TEXT, halloweenActive } from '@/lib/event';
import { type Mode, type View, pathFor, parsePath } from '@/lib/routes';
import {
  DAILY_GOAL,
  type Progress,
  dayKey,
  empty,
  levelInfo,
  buyItem,
  candyBalance,
  toggleEquip,
  load,
  merge,
  sanitize,
  record,
  save,
  streak,
  topicKey,
  weakTopics,
} from '@/lib/progress';

type Passage = { title: string | null; body: string | null; image_url: string | null };
type Q = {
  id: number;
  subject: string;
  number: number;
  kind: 'abcd' | 'short';
  topic: string;
  prompt: string;
  image_url: string | null;
  options: string[] | null;
  passage: Passage | null;
  source?: string | null;
};
type TestInfo = { id: number; year: number; variant: string; title: string | null; duration_min: number | null; n?: number };
type SubjectMeta = { label: string; topics: { name: string; n: number }[]; tests: TestInfo[] };
type Result = { id: number; ok: boolean; correct: string; explanation: string | null; verified: boolean };
type Session = { practice: boolean; label: string; levelStart: number };

const LETTERS = ['A', 'B', 'C', 'D'];
const PRAISE = ['Správne!', 'Sedí.', 'Presne tak.', 'Výborne!', 'Čistá práca.'];
const MARK_NAMES = ['', 'výborný', 'chválitebný', 'dobrý', 'dostatočný', 'nedostatočný'];
const MARK_LINES = [
  '',
  'Čistá práca.',
  'Skoro bez chyby.',
  'Dobrý základ. Prejdi si chyby.',
  'Ešte to treba potrénovať.',
  'Je to začiatok. Chyby si vezmeme po jednej.',
];

function plural(n: number, one: string, few: string, many: string) {
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return few;
  return many;
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Ukážky z oficiálnych testov sa neprepisujú: v databáze je namiesto obrázka odkaz na PDF (napr. /pdf/test.pdf#page=2).
function isPdf(url: string) {
  return /\.pdf(#|$)/i.test(url);
}
function pdfPage(url: string) {
  const m = /#page=(\d+)/.exec(url);
  return m ? m[1] : null;
}

function markFor(p: number) {
  if (p >= 0.9) return 1;
  if (p >= 0.75) return 2;
  if (p >= 0.5) return 3;
  if (p >= 0.3) return 4;
  return 5;
}

function PenMark({ ok }: { ok: boolean }) {
  return ok ? (
    <svg className="pen pen--ok" viewBox="0 0 40 40" aria-hidden="true">
      <path d="M6 21 L16 31 L34 8" />
    </svg>
  ) : (
    <svg className="pen pen--bad" viewBox="0 0 40 40" aria-hidden="true">
      <path d="M8 8 L32 32" />
      <path className="pen__second" d="M32 8 L8 32" />
    </svg>
  );
}

const SOURCE_NOTE = 'Ide o vlastné cvičné úlohy, nie o oficiálny test.';

// Obrázok, ktorý sa po klepnutí otvorí na celú obrazovku (na mobile sa dá posúvať a priblížiť).
function ZoomImg({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  return (
    <>
      <button type="button" className="zoomable" onClick={() => setOpen(true)} aria-label={alt + ' (zväčšiť)'}>
        <img className={className} src={src} alt={alt} />
        <span className="zoomable__hint">🔍 Klepni pre zväčšenie</span>
      </button>
      {open && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={alt}>
          <button type="button" className="lightbox__close" onClick={() => setOpen(false)}>✕ Zavrieť</button>
          <div className="lightbox__scroll" onClick={() => setOpen(false)}>
            <img src={src} alt={alt} />
          </div>
        </div>
      )}
    </>
  );
}

function HomeInner({
  initialSubject = 'aj',
  initialMode = 'topics',
  initialJournal = false,
  initialShop = false,
}: {
  initialSubject?: string;
  initialMode?: Mode;
  initialJournal?: boolean;
  initialShop?: boolean;
}) {
  // ---------- dáta zo servera ----------
  const [meta, setMeta] = useState<Record<string, SubjectMeta> | null>(null);
  const [metaError, setMetaError] = useState('');
  const [slow, setSlow] = useState(false);

  // ---------- nastavenie ----------
  const [subject, setSubject] = useState(initialSubject);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [picked, setPicked] = useState<string[]>([]);
  const [myLevel, setMyLevel] = useState<number | null>(null);
  useEffect(() => { setMyLevel(readLevel()?.level ?? null); }, []);
  const [testId, setTestId] = useState<number | null>(null);
  const [limit, setLimit] = useState(10);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ---------- postup (ukladá sa v prehliadači) ----------
  const [prog, setProg] = useState<Progress>(empty());
  const [user, setUser] = useState<User | null>(null);
  const [syncing, setSyncing] = useState(false);
  const userRef = useRef<User | null>(null);
  const dirtyRef = useRef(false); // máme zmeny, ktoré ešte nie sú na serveri
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  userRef.current = user;

  // ---------- priebeh tréningu ----------
  const [qs, setQs] = useState<Q[] | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<number, Result>>({});
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [busy, setBusy] = useState(false);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [sessionXp, setSessionXp] = useState(0);
  const [jTopic, setJTopic] = useState<string | null>(null);
  const [note, setNote] = useState<{ subject: string; topic: string; n: number; key: number } | null>(null);
  const [flash, setFlash] = useState<{ xp: number; candy: number; key: number } | null>(null);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [onlyWrong, setOnlyWrong] = useState(true);
  const [journalOpen, setJournalOpenState] = useState(initialJournal);

  const setJournalOpen = (open: boolean) => setJournalOpenState(open);
  const [shopOpen, setShopOpen] = useState(initialShop);
  const pickSubject = (key: string) => setSubject(key);

  // Aktuálne hodnoty pre asynchrónne funkcie a klávesnicu (aby nečítali zastarané stavy).
  const qsRef = useRef<Q[] | null>(null);
  const answersRef = useRef<Record<number, string>>({});
  const resultsRef = useRef<Record<number, Result>>({});
  const progRef = useRef<Progress>(empty());
  const comboRef = useRef(0);
  const practiceRef = useRef(true);
  const gradingRef = useRef(false);
  qsRef.current = qs;
  answersRef.current = answers;
  resultsRef.current = results;
  progRef.current = prog;
  comboRef.current = combo;
  practiceRef.current = session?.practice ?? true;

  // upozornenie na nový záznam v zápisníku sa po chvíli samo schová
  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(null), 7000);
    return () => clearTimeout(t);
  }, [note]);

  function loadMeta() {
    setMetaError('');
    fetch('/api/meta')
      .then((r) => {
        if (!r.ok) throw new Error('meta');
        return r.json();
      })
      .then((d) => setMeta(d.subjects))
      .catch(() => setMetaError('Nepodarilo sa načítať úlohy. Skontroluj internet a skús to znova.'));
  }

  // Po prihlásení: spoj postup z prehliadača s postupom z účtu a ulož výsledok na oba miesta.
  async function pullAndMerge() {
    setSyncing(true);
    try {
      const r = await fetch('/api/progress', { cache: 'no-store' });
      if (!r.ok) return;
      const d = await r.json();
      commitProg(merge(progRef.current, sanitize(d.progress)));
    } catch {
      // bez internetu pokračuje lokálny postup
    } finally {
      setSyncing(false);
    }
  }

  // Prevezme postup zo servera (zmeny z iného zariadenia), ak nemáme vlastné neuložené zmeny.
  async function pullFresh() {
    if (!userRef.current || dirtyRef.current) return;
    try {
      const r = await fetch('/api/progress', { cache: 'no-store' });
      if (!r.ok || dirtyRef.current) return;
      const d = await r.json();
      const next = sanitize(d.progress);
      if (JSON.stringify(next) !== JSON.stringify(progRef.current)) {
        progRef.current = next;
        setProg(next);
        save(next);
      }
    } catch {
      // bez internetu sa skúsi neskôr
    }
  }

  function pushSoon() {
    if (!userRef.current) return;
    dirtyRef.current = true;
    setSyncing(true);
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(async () => {
      try {
        const sent = progRef.current;
        const r = await fetch('/api/progress', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ progress: sent }),
        });
        if (r.ok) {
          const d = await r.json();
          // ak sa medzitým nič nezmenilo, prevezmi spojenú verziu zo servera
          if (progRef.current === sent) {
            const next = sanitize(d.progress);
            progRef.current = next;
            setProg(next);
            save(next);
            dirtyRef.current = false;
          }
        }
      } catch {
        // skúsi sa znova pri ďalšej zmene
      } finally {
        setSyncing(false);
      }
    }, 800);
  }

  useEffect(() => {
    setProg(load());
    progRef.current = load();
    fetch('/api/auth', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          userRef.current = d.user;
          setUser(d.user);
          pullAndMerge();
        }
      })
      .catch(() => {});
    loadMeta();
    const t = setTimeout(() => setSlow(true), 6000);
    return () => clearTimeout(t);
  }, []);

  // ---------- Halloween ----------
  const [spooky, setSpooky] = useState(false);
  useEffect(() => {
    const on = halloweenActive();
    setSpooky(on);
    document.body.classList.toggle('halloween', on);
    return () => document.body.classList.remove('halloween');
  }, []);

  // ---------- adresa v prehliadači ----------
  const view: View = shopOpen ? 'shop' : journalOpen ? 'journal' : qs ? (finished ? 'results' : 'session') : 'home';
  const wantPath = pathFor(view, subject, mode, session ? !session.practice : false);
  const wantRef = useRef(wantPath);
  wantRef.current = wantPath;
  const firstUrl = useRef(true);
  const resetRef = useRef<() => void>(() => {});
  resetRef.current = reset;
  const hasQsRef = useRef(false);
  hasQsRef.current = !!qs;

  useEffect(() => {
    try {
      const cur = window.location.pathname.replace(/\/+$/, '') || '/';
      if (cur === wantPath) {
        firstUrl.current = false;
        return;
      }
      // do nového pohľadu (tréning, výsledky, zápisník) pridáme záznam do histórie, inak adresu len nahradíme
      const enter = view !== 'home' && !firstUrl.current;
      if (enter) window.history.pushState(null, '', wantPath);
      else window.history.replaceState(null, '', wantPath);
      firstUrl.current = false;
    } catch {
      // adresa sa nezmení, aplikácia funguje ďalej
    }
  }, [wantPath]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tlačidlá Späť / Vpred v prehliadači.
  useEffect(() => {
    const onPop = () => {
      const p = parsePath(window.location.pathname);
      if (p.view === 'shop') {
        setShopOpen(true);
      } else if (p.view === 'journal') {
        setShopOpen(false);
        setJournalOpenState(true);
      } else if (p.view === 'home') {
        setShopOpen(false);
        setJournalOpenState(false);
        if (hasQsRef.current) resetRef.current();
        if (p.subject) setSubject(p.subject);
        setMode(p.mode ?? 'topics');
      } else {
        // do tréningu alebo výsledkov sa po Vpred vrátiť nedá: zostaň tam, kde si
        try {
          window.history.replaceState(null, '', wantRef.current);
        } catch {}
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Automatická synchronizácia: keď sa vrátiš na kartu a potom každých 20 s.
  useEffect(() => {
    if (!user) return;
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      if (dirtyRef.current) pushSoon(); // predchádzajúce uloženie zlyhalo, skús znova
      else pullFresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    const iv = setInterval(onVisible, 20000);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
      clearInterval(iv);
    };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = meta?.[subject];
  useEffect(() => {
    setPicked([]);
    const lv = readLevel();
    const rec = lv ? LEVELS[lv.level - 1].variant : null;
    setTestId((current?.tests.find((t) => t.variant === rec) ?? current?.tests[0])?.id ?? null);
  }, [subject, meta]); // eslint-disable-line react-hooks/exhaustive-deps

  function commitProg(p: Progress) {
    progRef.current = p;
    setProg(p);
    save(p);
    pushSoon();
  }

  // ---------- kontrola odpovedí ----------
  async function grade(ids: number[]): Promise<boolean> {
    if (gradingRef.current) return false;
    const todo = ids.filter((id) => !resultsRef.current[id]);
    if (!todo.length) return true;
    gradingRef.current = true;
    setBusy(true);
    try {
      const r = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: todo.map((id) => ({ id, answer: answersRef.current[id] ?? '' })) }),
      });
      if (!r.ok) throw new Error('check');
      const d = await r.json();
      const list: Result[] = d.results;
      const qmap = new Map((qsRef.current ?? []).map((q) => [q.id, q]));

      let p = progRef.current;
      let c = comboRef.current;
      let gained = 0;
      let gainedCandy = 0;
      let newMistakes = 0;
      let lastWrong = null as Q | null;
      const before = levelInfo(p.xp).level;
      for (const res of list) {
        const q = qmap.get(res.id);
        if (!q) continue;
        if (!res.ok) {
          newMistakes += 1;
          lastWrong = q;
        }
        c = res.ok ? c + 1 : 0;
        const out = record(p, q.subject, q.topic, q.id, res.ok, practiceRef.current ? c : 0);
        p = out.next;
        gained += out.xp;
        gainedCandy += out.candy;
      }
      commitProg(p);
      setResults((prev) => {
        const next = { ...prev };
        for (const res of list) next[res.id] = res;
        return next;
      });
      setCombo(c);
      setBestCombo((b) => Math.max(b, c));
      setSessionXp((x) => x + gained);
      const lw = lastWrong as Q | null;
      if (lw) setNote({ subject: lw.subject, topic: lw.topic, n: newMistakes, key: Date.now() });
      if (list.length === 1) setFlash({ xp: gained, candy: gainedCandy, key: Date.now() });
      const after = levelInfo(p.xp).level;
      if (after > before) setLevelUp(after);
      setError('');
      return true;
    } catch {
      setError('Odpoveď sa nepodarilo skontrolovať. Skús to znova.');
      return false;
    } finally {
      gradingRef.current = false;
      setBusy(false);
    }
  }

  async function finish() {
    if (!qs || finished) return;
    const ok = await grade(qs.map((q) => q.id));
    if (ok) {
      setOnlyWrong(true);
      setFinished(true);
    }
  }

  // Časovač pre celý test
  useEffect(() => {
    if (secondsLeft === null || finished) return;
    if (secondsLeft <= 0) {
      void finish();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => (s === null ? s : s - 1)), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, finished]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- spustenie ----------
  async function begin(params: URLSearchParams, o: { practice: boolean; label: string; minutes?: number | null }) {
    setError('');
    setLoading(true);
    try {
      const r = await fetch('/api/questions?' + params.toString());
      if (!r.ok) throw new Error('questions');
      const d = await r.json();
      if (!d.questions?.length) {
        setError('Pre tento výber zatiaľ nie sú žiadne úlohy.');
        return;
      }
      setQs(d.questions);
      setSession({ practice: o.practice, label: o.label, levelStart: levelInfo(progRef.current.xp).level });
      setI(0);
      setAnswers({});
      setResults({});
      setFinished(false);
      setCombo(0);
      setBestCombo(0);
      setSessionXp(0);
      setFlash(null);
      setLevelUp(null);
      setSecondsLeft(o.minutes ? o.minutes * 60 : null);
    } catch {
      setError('Nepodarilo sa načítať úlohy. Skús to znova.');
    } finally {
      setLoading(false);
    }
  }

  const weak = useMemo(
    () => (current ? weakTopics(prog, subject, current.topics.map((t) => t.name)) : []),
    [prog, subject, current]
  );
  const mistakeIds = useMemo(() => Object.keys(prog.mistakes), [prog.mistakes]);

  function startQuick() {
    const p = new URLSearchParams({ subject, limit: '10' });
    if (weak.length) p.set('topics', weak.join(','));
    void begin(p, { practice: true, label: 'Dnešný tréning' });
  }
  function startTopics() {
    const p = new URLSearchParams({ subject, limit: String(limit) });
    if (picked.length) p.set('topics', picked.join(','));
    void begin(p, { practice: true, label: picked.length ? picked.join(', ') : 'Všetky témy' });
  }
  function startTest() {
    if (!testId) return setError('Najprv vyber test.');
    const t = current?.tests.find((x) => x.id === testId);
    void begin(new URLSearchParams({ subject, test: String(testId) }), {
      practice: false,
      label: t?.title || 'Celý test',
      minutes: t?.duration_min ?? null,
    });
  }
  function startMistakes() {
    const ids = [...mistakeIds].sort(() => Math.random() - 0.5).slice(0, 20);
    void begin(new URLSearchParams({ ids: ids.join(',') }), { practice: true, label: 'Zošit chýb' });
  }
  // Spustenie tréningu zo zápisníka: zápisník sa zavrie a začne sa cvičenie.
  function journalTopic(sub: string, topic: string) {
    setJournalOpen(false);
    setSubject(sub);
    void begin(new URLSearchParams({ subject: sub, limit: '10', topics: topic }), { practice: true, label: topic });
  }
  function journalIds(ids: number[], label: string) {
    setJournalOpen(false);
    const pick = [...ids].sort(() => Math.random() - 0.5).slice(0, 20);
    void begin(new URLSearchParams({ ids: pick.join(',') }), { practice: true, label });
  }
  function startRetry() {
    if (!qs) return;
    const ids = qs.filter((q) => !results[q.id]?.ok).map((q) => q.id);
    if (!ids.length) return;
    void begin(new URLSearchParams({ ids: ids.join(',') }), { practice: true, label: 'Oprava chýb' });
  }

  function reset() {
    setQs(null);
    setSession(null);
    setSecondsLeft(null);
    setFinished(false);
    setError('');
  }

  function setAnswer(id: number, value: string) {
    setAnswers((a) => ({ ...a, [id]: value }));
  }

  function goNext() {
    if (!qs) return;
    if (i < qs.length - 1) {
      setI(i + 1);
    } else if (session?.practice) {
      void finish();
    }
  }

  // Zmena úlohy: posun hore, vyčistenie krátkych oznamov
  useEffect(() => {
    setFlash(null);
    setLevelUp(null);
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  }, [i, qs]);

  // ---------- klávesnica: A–D / 1–4 vyberie odpoveď, Enter skontroluje a posunie ďalej ----------
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => {});
  keyRef.current = (e) => {
    if (!qs || finished || e.metaKey || e.ctrlKey || e.altKey) return;
    const q = qs[i];
    const locked = !!results[q.id];
    const tag = (e.target as HTMLElement | null)?.tagName ?? '';
    const practice = session?.practice ?? true;

    if (q.kind === 'abcd' && !locked && tag !== 'INPUT' && tag !== 'SELECT') {
      const byLetter = 'abcd'.indexOf(e.key.toLowerCase());
      const byNumber = ['1', '2', '3', '4'].indexOf(e.key);
      const k = e.key.length === 1 ? (byLetter >= 0 ? byLetter : byNumber) : -1;
      if (k >= 0 && q.options?.[k]) {
        setAnswer(q.id, LETTERS[k]);
        return;
      }
    }
    if (e.key === 'Enter' && tag !== 'BUTTON' && tag !== 'SELECT' && tag !== 'A') {
      if (practice) {
        if (!locked) {
          if ((answers[q.id] ?? '').trim()) void grade([q.id]);
        } else {
          goNext();
        }
      } else if (i < qs.length - 1) {
        setI(i + 1);
      }
    }
  };
  useEffect(() => {
    const h = (e: KeyboardEvent) => keyRef.current(e);
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const score = useMemo(() => Object.values(results).filter((r) => r.ok).length, [results]);

  // ---------- spoločné prvky ----------
  const lvl = levelInfo(prog.xp);
  const days = streak(prog.days);
  const todayCount = prog.days[dayKey()] ?? 0;

  const journalEl =
    journalOpen && meta ? (
    <Journal
      meta={meta}
      prog={prog}
      startSubject={subject}
      startTopic={jTopic}
      onClose={() => setJournalOpen(false)}
      onPracticeTopic={journalTopic}
      onPracticeIds={journalIds}
    />
    ) : null;

  const noteEl =
    note && !journalOpen && !shopOpen ? (
    <div className="jtoast" key={note.key} role="status">
      <span className="jtoast__icon" aria-hidden="true">📓</span>
      <div className="jtoast__text">
        <b>{note.n > 1 ? `${note.n} nové záznamy v zápisníku` : 'Nový záznam v zápisníku'}</b>
        <span>{note.topic}</span>
      </div>
      <button
        type="button"
        className="jtoast__btn"
        onClick={() => {
          setJTopic(note.topic);
          if (meta?.[note.subject]) setSubject(note.subject);
          setNote(null);
          setJournalOpen(true);
        }}
      >
        Otvoriť
      </button>
      <button type="button" className="jtoast__x" onClick={() => setNote(null)} aria-label="Skryť upozornenie">×</button>
    </div>
  ) : null;

  // ---------- načítavanie ----------
  if (!meta) {
    return (
      <main>
        <h1 className="brand__name">Cvičko <span className="nine">Angličtina</span></h1>
        {metaError ? (
          <div className="notice notice--bad" role="alert">
            <p>{metaError}</p>
            <button className="btn btn--primary" onClick={loadMeta}>Skúsiť znova</button>
          </div>
        ) : (
          <p className="loading" role="status">
            <span className="loading__pencil" aria-hidden="true" />
            {slow ? 'Databáza sa práve budí, môže to chvíľu trvať…' : 'Načítavam úlohy…'}
          </p>
        )}
        {noteEl}
      </main>
    );
  }

  // =====================================================================
  // VÝSLEDOK
  // =====================================================================
  if (qs && finished) {
    const total = qs.length;
    const pct = total ? score / total : 0;
    const mark = markFor(pct);
    const wrong = qs.filter((q) => !results[q.id]?.ok);
    const byTopic = new Map<string, { ok: number; n: number }>();
    for (const q of qs) {
      const t = byTopic.get(q.topic) ?? { ok: 0, n: 0 };
      t.n += 1;
      if (results[q.id]?.ok) t.ok += 1;
      byTopic.set(q.topic, t);
    }
    const shown = onlyWrong && wrong.length ? wrong : qs;
    const levelNow = levelInfo(prog.xp).level;

    return (
      <main>
        <p className="crumb">{session?.label}</p>
        <section className="report">
          <div className={'stamp stamp--' + (mark <= 2 ? 'good' : mark === 3 ? 'mid' : 'low')} aria-label={`Známka ${mark}`}>
            <span className="stamp__num">{mark}</span>
          </div>
          <div className="report__text">
            <h1 className="report__title">{score} z {total} správne</h1>
            <p className="report__mark">Známka {mark} – {MARK_NAMES[mark]}. {MARK_LINES[mark]}</p>
            <p className="report__xp">
              <strong>+{sessionXp} XP</strong>
              {bestCombo >= 3 && session?.practice ? ` · najdlhšia séria ${bestCombo} správnych` : ''}
              {levelNow > (session?.levelStart ?? levelNow) ? ` · nová úroveň ${levelNow}` : ''}
            </p>
          </div>
        </section>

        <section className="panel">
          <h2 className="panel__title">Po témach</h2>
          <ul className="breakdown">
            {[...byTopic.entries()].map(([name, t]) => (
              <li key={name} className="breakdown__row">
                <span className="breakdown__name">{name}</span>
                <span className="breakdown__bar" aria-hidden="true">
                  <i style={{ width: `${(100 * t.ok) / t.n}%` }} />
                </span>
                <span className="breakdown__n">{t.ok}/{t.n}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="actions">
          {wrong.length > 0 && (
            <button className="btn btn--primary" onClick={startRetry} disabled={loading}>
              Opraviť chyby ({wrong.length})
            </button>
          )}
          <button className={'btn ' + (wrong.length ? 'btn--ghost' : 'btn--primary')} onClick={reset}>
            Nový tréning
          </button>
        </div>

        <p className="source source--light">{[...new Set(qs.map((x) => x.source).filter(Boolean))].join('; ') || 'Cvičný test'}. {SOURCE_NOTE}</p>

        <section className="panel">
          <div className="panel__head">
            <h2 className="panel__title">Prehľad úloh</h2>
            {wrong.length > 0 && (
              <button className="link" onClick={() => setOnlyWrong((v) => !v)}>
                {onlyWrong ? 'Ukázať všetky' : 'Ukázať len chyby'}
              </button>
            )}
          </div>
          {shown.map((q) => {
            const r = results[q.id];
            const mine = answers[q.id];
            return (
              <article key={q.id} className={'review ' + (r?.ok ? 'review--ok' : 'review--bad')}>
                <header className="review__head">
                  <span className="review__mark" aria-label={r?.ok ? 'Správne' : 'Nesprávne'}>
                    <PenMark ok={!!r?.ok} />
                  </span>
                  <span className="review__meta">Úloha {q.number} · {q.topic}</span>
                </header>
                <p className="review__prompt">{q.prompt}</p>
                {q.image_url && <img className="q-img" src={q.image_url} alt="Obrázok k úlohe" loading="lazy" />}
                <p className="review__answer">
                  Tvoja odpoveď: <strong>{mine ? answerText(q, mine) : '—'}</strong>
                  {!r?.ok && <> · správne: <strong>{answerText(q, r?.correct ?? '')}</strong></>}
                </p>
                {r?.explanation && <p className="review__why">{r.explanation}</p>}
              </article>
            );
          })}
        </section>
        {noteEl}
        {journalEl}
      </main>
    );
  }

  // =====================================================================
  // ÚLOHA
  // =====================================================================
  if (qs) {
    const q = qs[i];
    const res = results[q.id];
    const practice = session?.practice ?? true;
    const locked = !!res;
    const answered = (answers[q.id] ?? '').trim() !== '';
    const last = i === qs.length - 1;
    const low = secondsLeft !== null && secondsLeft <= 300;

    return (
      <main>
        <div className="play-top">
          <button className="link" onClick={reset} aria-label="Domov (ukončí tréning)">← Domov</button>
          <span className="crumb crumb--inline">{session?.label}</span>
          {secondsLeft !== null && (
            <span className={'timer' + (low ? ' timer--low' : '')} role="timer" aria-label="Zostávajúci čas">
              {fmt(secondsLeft)}
            </span>
          )}
        </div>

        <nav className="dots" aria-label="Úlohy">
          {qs.map((x, k) => {
            const r = results[x.id];
            let cls = 'dot';
            if (k === i) cls += ' dot--now';
            if (r) cls += r.ok ? ' dot--ok' : ' dot--bad';
            else if ((answers[x.id] ?? '').trim()) cls += ' dot--set';
            return (
              <button key={x.id} className={cls} onClick={() => setI(k)} aria-label={`Úloha ${k + 1}`} aria-current={k === i}>
                {k + 1}
              </button>
            );
          })}
          {practice && combo >= 2 && (
            <span className="combo" key={combo}>
              séria ×{combo}{combo >= 3 ? ' · +5 XP' : ''}
            </span>
          )}
        </nav>

        <section className="sheet" key={q.id}>
          <p className="sheet__meta">{q.topic}</p>
          <p className="source">Zdroj: {q.source ?? 'cvičné úlohy'}. {SOURCE_NOTE}</p>

          {q.passage && (
            <div className="passage">
              {q.passage.title && <p className="passage__title">{q.passage.title}</p>}
              {q.passage.body && <p>{q.passage.body}</p>}
              {q.passage.image_url &&
                (isPdf(q.passage.image_url) ? (
                  <a className="pdf-link" href={q.passage.image_url} target="_blank" rel="noopener noreferrer">
                    Otvoriť ukážku v PDF teste{pdfPage(q.passage.image_url) ? ' (strana ' + pdfPage(q.passage.image_url) + ')' : ''}
                    <small>otvorí sa v novej karte</small>
                  </a>
                ) : (
                  <ZoomImg className="q-img" src={q.passage.image_url} alt="Obrázok k zadaniu" />
                ))}
            </div>
          )}

          <p className="prompt">{q.prompt}</p>
          {q.image_url && <ZoomImg className="q-img" src={q.image_url} alt="Obrázok k úlohe" />}

          {q.kind === 'abcd' ? (
            <div className="options" role="group" aria-label="Možnosti odpovede">
              {q.options?.map((o, k) => {
                const letter = LETTERS[k];
                let cls = 'option';
                if (res) {
                  if (letter === res.correct) cls += ' option--ok';
                  else if (answers[q.id] === letter) cls += ' option--bad';
                } else if (answers[q.id] === letter) cls += ' option--sel';
                return (
                  <button
                    key={k}
                    className={cls}
                    disabled={locked}
                    aria-pressed={answers[q.id] === letter}
                    onClick={(e) => {
                      setAnswer(q.id, letter);
                      e.currentTarget.blur();
                    }}
                  >
                    <span className="option__letter">{letter}</span>
                    <span className="option__text">{o}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              <label className="field">
                <span className="field__label">Tvoja odpoveď</span>
                <input
                  key={q.id}
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  autoFocus
                  placeholder="write your answer"
                  value={answers[q.id] ?? ''}
                  disabled={locked}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                />
              </label>
              {!locked && (
                <p className="hint">Pozor na pravopis. Veľké a malé písmená nehrajú rolu.</p>
              )}
            </>
          )}

          {res && (
            <div className={'verdict ' + (res.ok ? 'verdict--ok' : 'verdict--bad')} role="status">
              <PenMark ok={res.ok} />
              <div className="verdict__body">
                <p className="verdict__title">{res.ok ? PRAISE[(q.id + i) % PRAISE.length] : 'Nie celkom.'}</p>
                {!res.ok && (
                  <p className="verdict__answer">
                    Správna odpoveď: <strong>{answerText(q, res.correct)}</strong>
                  </p>
                )}
                {res.explanation && <p className="verdict__why">{res.explanation}</p>}
                {!res.verified && (
                  <p className="verdict__note">Odpoveď k tejto úlohe zatiaľ nie je overená podľa oficiálneho kľúča.</p>
                )}
                {levelUp && <p className="verdict__level">Nová úroveň: {levelUp}</p>}
              </div>
              {flash && (
                <span className="xp-pop" key={flash.key}>+{flash.xp} XP{flash.candy > 0 ? ` · +${flash.candy} 🍬` : ''}</span>
              )}
            </div>
          )}
        </section>

        {error && (
          <p className="notice notice--bad" role="alert">{error}</p>
        )}

        <div className="actions actions--play">
          <button className="btn btn--ghost" disabled={i === 0} onClick={() => setI(i - 1)}>Späť</button>

          {practice ? (
            !locked ? (
              <>
                <button className="btn btn--primary" disabled={!answered || busy} onClick={() => void grade([q.id])}>
                  Skontrolovať
                </button>
                {!last && (
                  <button className="btn btn--ghost" onClick={() => setI(i + 1)}>Preskočiť</button>
                )}
                {last && (
                  <button className="btn btn--ghost" disabled={busy} onClick={() => void finish()}>Vyhodnotiť</button>
                )}
              </>
            ) : last ? (
              <button className="btn btn--primary" disabled={busy} onClick={() => void finish()}>Vyhodnotiť</button>
            ) : (
              <button className="btn btn--primary" onClick={() => setI(i + 1)}>Ďalej</button>
            )
          ) : (
            <>
              {!last && <button className="btn btn--ghost" onClick={() => setI(i + 1)}>Ďalej</button>}
              <button className="btn btn--primary" disabled={busy} onClick={() => void finish()}>Odovzdať test</button>
            </>
          )}
        </div>

        <p className="hint">
          {q.kind === 'abcd' ? 'Klávesy A–D vyberú odpoveď. ' : ''}
          {practice ? 'Enter skontroluje a posunie ďalej.' : 'V teste uvidíš výsledky až po odovzdaní.'}
        </p>
        {noteEl}
        {journalEl}
      </main>
    );
  }

  // =====================================================================
  // DOMOVSKÁ OBRAZOVKA
  // =====================================================================
  const hasContent = (s: SubjectMeta) => s.topics.length > 0 || s.tests.length > 0;
  const totalQ = (s: SubjectMeta) => s.topics.reduce((n, t) => n + t.n, 0);
  const goal = Math.min(todayCount, DAILY_GOAL);
  const allPicked = !!current && current.topics.length > 0 && picked.length === current.topics.length;
  const pickedLabel = picked.length
    ? `${picked.length} ${plural(picked.length, 'téma', 'témy', 'tém')}`
    : 'všetky témy';

  return (
    <main>
      {spooky && (
        <div className="event" role="status">
          <span aria-hidden="true">🎃</span> Halloweenska výzva ({EVENT_END_TEXT}): <b>dvojnásobné XP</b> a za správne odpovede <b>cukríky 🍬</b>, ktoré minieš v Halloween obchode.
          <button type="button" className="event__btn" onClick={() => setShopOpen(true)}>Do obchodu</button>
        </div>
      )}
      <header className="top">
        <div>
          <h1 className="brand__name">Cvičko <span className="nine">Angličtina</span></h1>
          <p className="brand__tag">Precvič si to. Zadarmo.</p>
        </div>
        <div className="top__tools">
        <a className="iconbtn" href="/zebricek" aria-label="Rebríček" title="Rebríček"><span aria-hidden="true">🏆</span></a>
        <Sites />
        <Account
          user={user}
          badge={prog.equipped.badge}
          syncing={syncing}
          onAuth={(u) => {
            userRef.current = u;
            setUser(u);
            pullAndMerge();
          }}
          onLogout={async () => {
            await fetch('/api/auth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'logout' }),
            }).catch(() => {});
            userRef.current = null;
            setUser(null);
          }}
        />
        </div>
        <div className="mini" aria-label="Tvoj postup">
          <div className="mini__level">
            <span className="level-badge level-badge--sm" aria-hidden="true">{lvl.level}</span>
            <div className="mini__levelbody">
              <b>Úroveň {lvl.level}</b>
              <span className="meter meter--thin" role="progressbar" aria-valuemin={0} aria-valuemax={lvl.span} aria-valuenow={lvl.into} aria-label="XP do ďalšej úrovne">
                <i style={{ width: `${(100 * lvl.into) / lvl.span}%` }} />
              </span>
            </div>
          </div>
          <div className="mini__item"><b>{days}</b> {plural(days, 'deň', 'dni', 'dní')} po sebe</div>
          <div className="mini__item"><b>{goal}/{DAILY_GOAL}</b> úloh dnes</div>
          {(spooky || prog.candy > 0 || prog.items.length > 0) && (
            <button type="button" className="mini__candy" onClick={() => setShopOpen(true)} aria-label="Otvoriť Halloween obchod">
              <b>{candyBalance(prog)}</b> 🍬 <span>obchod</span>
            </button>
          )}
        </div>
      </header>

      <nav className="subjects" aria-label="Predmet">
        {Object.entries(meta).map(([key, s]) => {
          const ok = hasContent(s);
          const n = totalQ(s);
          return (
            <button
              key={key}
              className={'subject' + (subject === key ? ' subject--on' : '')}
              aria-pressed={subject === key}
              disabled={!ok}
              onClick={() => pickSubject(key)}
            >
              <span className="subject__name">{s.label}</span>
              <span className="subject__n">{ok ? `${n} ${plural(n, 'úloha', 'úlohy', 'úloh')}` : 'čoskoro'}</span>
            </button>
          );
        })}
      </nav>

      <section className="today">
        <div className="today__text">
          <h2 className="today__title">Dnešný tréning</h2>
          <p>
            {weak.length
              ? `Desať úloh z tém, ktoré ti idú najhoršie: ${weak.join(', ')}.`
              : 'Desať náhodných úloh. Po prvom tréningu sem dáme témy, ktoré ti idú najhoršie.'}
          </p>
        </div>
        <button className="btn btn--primary btn--big" onClick={startQuick} disabled={loading || !current || !hasContent(current)}>
          {loading ? 'Načítavam…' : 'Spustiť tréning'}
        </button>
      </section>

      <section className="panel">
        <h2 className="panel__title">Vlastný výber</h2>
        <div className="seg" role="group" aria-label="Režim">
          <button className={'seg__btn' + (mode === 'topics' ? ' seg__btn--on' : '')} aria-pressed={mode === 'topics'} onClick={() => setMode('topics')}>
            Témy
          </button>
          <button className={'seg__btn' + (mode === 'test' ? ' seg__btn--on' : '')} aria-pressed={mode === 'test'} onClick={() => setMode('test')}>
            Celý test
          </button>
          <button className={'seg__btn' + (mode === 'mistakes' ? ' seg__btn--on' : '')} aria-pressed={mode === 'mistakes'} onClick={() => setMode('mistakes')}>
            Zápisník{mistakeIds.length ? ` (${mistakeIds.length})` : ''}
          </button>
        </div>

        {mode === 'topics' && (
          <div className="mode">
            <div className="mode__head">
              <p className="mode__hint">Vyber témy, ktoré chceš precvičiť. Nič nevybrané = všetky.</p>
              {current && current.topics.length > 0 && (
                <button className="link" onClick={() => setPicked(allPicked ? [] : current.topics.map((t) => t.name))}>
                  {allPicked ? 'Zrušiť výber' : 'Vybrať všetky'}
                </button>
              )}
            </div>
            {current?.topics.length ? (
              <div className="tlist">
                {current.topics.map((t) => {
                  const on = picked.includes(t.name);
                  const st = prog.topics[topicKey(subject, t.name)];
                  const pct = st && st.a ? Math.round((100 * st.c) / st.a) : null;
                  const tone = pct === null ? '' : pct >= 80 ? ' mastery--good' : pct >= 50 ? ' mastery--mid' : ' mastery--low';
                  return (
                    <button
                      key={t.name}
                      className={'trow' + (on ? ' trow--on' : '')}
                      aria-pressed={on}
                      onClick={() => setPicked((p) => (on ? p.filter((x) => x !== t.name) : [...p, t.name]))}
                    >
                      <span className="trow__box" aria-hidden="true" />
                      <span className="trow__name">{t.name}</span>
                      <span className="trow__n">{t.n} {plural(t.n, 'úloha', 'úlohy', 'úloh')}</span>
                      <span className={'mastery' + tone} aria-hidden="true">
                        <i style={{ width: `${pct === null ? 0 : Math.max(pct, 6)}%` }} />
                      </span>
                      <span className="trow__pct">{pct === null ? 'nové' : `${pct} %`}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="muted">Zatiaľ tu nie sú žiadne úlohy.</p>
            )}
            <div className="count">
              <span className="count__label">Počet úloh</span>
              <div className="row">
                {[5, 10, 20, 30].map((n) => (
                  <button key={n} className={'chip chip--num' + (limit === n ? ' chip--on' : '')} aria-pressed={limit === n} onClick={() => setLimit(n)}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="startbar">
              <p className="startbar__sum">Vybrané: <b>{pickedLabel}</b> · <b>{limit} {plural(limit, 'úloha', 'úlohy', 'úloh')}</b></p>
              <button className="btn btn--primary" onClick={startTopics} disabled={loading}>
                {loading ? 'Načítavam…' : 'Spustiť'}
              </button>
            </div>
          </div>
        )}

        {mode === 'test' && (
          <div className="mode">
            <p className="mode__hint">Ako na skúške: beží časovač a výsledky uvidíš až po odovzdaní.</p>
            {myLevel && (
              <p className="mode__hint">
                Tvoja úroveň: <b>{LEVELS[myLevel - 1].code} – {LEVELS[myLevel - 1].name}</b>. Odporúčaný test je označený ⭐.
                <button className="pl__retake" onClick={() => { clearLevel(); window.location.reload(); }}>Zopakovať úrovňový test</button>
              </p>
            )}
            <p className="source source--box">{SOURCE_NOTE}</p>
            <div className="tlist">
              {[...(current?.tests ?? [])].sort((a, b) => Number(b.variant === (myLevel ? LEVELS[myLevel - 1].variant : '')) - Number(a.variant === (myLevel ? LEVELS[myLevel - 1].variant : ''))).map((t) => (
                <button
                  key={t.id}
                  className={'trow trow--test' + (testId === t.id ? ' trow--on' : '')}
                  aria-pressed={testId === t.id}
                  onClick={() => setTestId(t.id)}
                >
                  <span className="trow__box trow__box--radio" aria-hidden="true" />
                  <span className="trow__name">{myLevel && t.variant === LEVELS[myLevel - 1].variant ? '⭐ ' : ''}{t.title || `${t.year} – variant ${t.variant}`}</span>
                  <span className="trow__n">
                    {t.n ? `${t.n} ${plural(t.n, 'úloha', 'úlohy', 'úloh')}` : ''}
                    {t.n && t.duration_min ? ' · ' : ''}
                    {t.duration_min ? `${t.duration_min} min` : ''}
                  </span>
                </button>
              ))}
            </div>
            <div className="startbar">
              <p className="startbar__sum">
                {(() => {
                  const t = current?.tests.find((x) => x.id === testId);
                  return t?.duration_min ? <>Na vypracovanie máš <b>{t.duration_min} minút</b>.</> : 'Test bez časového limitu.';
                })()}
              </p>
              <button className="btn btn--primary" onClick={startTest} disabled={loading || !testId}>
                {loading ? 'Načítavam…' : 'Spustiť test'}
              </button>
            </div>
          </div>
        )}

        {mode === 'mistakes' && (
          <div className="mode">
            <p className="mode__hint">
              Zápisník má krátke zhrnutie každej témy a zapisuje si tvoje chyby.
              {mistakeIds.length
                ? ` Máš v ňom ${mistakeIds.length} ${plural(mistakeIds.length, 'otvorenú chybu', 'otvorené chyby', 'otvorených chýb')}. Úloha z neho zmizne, keď ju vyriešiš správne dvakrát po sebe.`
                : ' Chyby, ktoré urobíš, sa sem uložia a budú sa vracať, kým ich dvakrát po sebe nevyriešiš.'}
            </p>
            <div className="startbar">
              <p className="startbar__sum">Zápisník platí pre všetky predmety.</p>
              <div className="row">
                <button className="btn" onClick={startMistakes} disabled={loading || !mistakeIds.length}>
                  {loading ? 'Načítavam…' : 'Prejsť chyby'}
                </button>
                <button className="btn btn--primary" onClick={() => { setJTopic(null); setJournalOpen(true); }} disabled={!meta}>
                  Otvoriť zápisník
                </button>
              </div>
            </div>
          </div>
        )}

        {error && <p className="notice notice--bad" role="alert">{error}</p>}
      </section>

      <p className="foot">
        {user
          ? 'Postup (XP, séria, zápisník chýb) sa ukladá do tvojho účtu.'
          : 'Bez účtu sa postup (XP, séria, zápisník chýb) ukladá iba v tomto prehliadači. Vytvor si účet a bude ho mať aj každé tvoje zariadenie.'}
      </p>
      <p className="foot">Neoficiálna stránka. Všetky úlohy sú vlastné cvičné úlohy a nepochádzajú z oficiálnych testov.</p>
      <p className="foot">
        <a href="/podmienky">Podmienky používania</a> · <a href="/ochrana-udajov">Ochrana osobných údajov</a>
      </p>
      <Support />

      <Fx fx={prog.equipped.fx} />
      <Consent />
      {shopOpen && (
        <Shop
          prog={prog}
          earning={spooky}
          onBuy={(id) => {
            const n = buyItem(progRef.current, id);
            if (n) commitProg(n);
          }}
          onEquip={(id) => commitProg(toggleEquip(progRef.current, id))}
          onClose={() => setShopOpen(false)}
        />
      )}

      {noteEl}

      {journalEl}
    </main>
  );
}

function answerText(q: Q, value: string) {
  if (q.kind === 'abcd') {
    const k = LETTERS.indexOf(value.toUpperCase());
    const text = k >= 0 ? q.options?.[k] : undefined;
    return text ? `${value.toUpperCase()} – ${text}` : value;
  }
  return value;
}


export default function Home(props: ComponentProps<typeof HomeInner>) {
  return (
    <LevelGate>
      <HomeInner {...props} />
    </LevelGate>
  );
}
