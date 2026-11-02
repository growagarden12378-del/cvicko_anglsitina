import { halloweenActive, xpMultiplier } from './event';
import { ITEMS, MAGNET, itemById } from './shop';
// Postup žiaka sa ukladá v prehliadači (localStorage) a, ak je prihlásený, aj na server (účet).

export type TopicStat = { a: number; c: number }; // a = pokusy, c = správne

export type Progress = {
  xp: number;
  days: Record<string, number>; // 'RRRR-MM-DD' -> počet vyriešených úloh
  topics: Record<string, TopicStat>; // 'predmet|téma' -> štatistika
  mistakes: Record<string, number>; // id úlohy -> koľkokrát po sebe už bola správne (0 alebo 1)
  candy: number; // cukríky zarobené celkovo (zostatok = zarobené − cena kúpených vecí)
  items: string[]; // kúpené veci z obchodu
  equipped: { badge?: string; fx?: string };
};

export const DAILY_GOAL = 10;
const KEY = 'tm9-progress-v1';

export function empty(): Progress {
  return { xp: 0, days: {}, topics: {}, mistakes: {}, candy: 0, items: [], equipped: {} };
}

// Overí tvar údajov (z localStorage alebo zo servera) a zahodí nezmysly.
export function sanitize(p: any): Progress {
  const out = empty();
  if (!p || typeof p !== 'object') return out;
  out.xp = Math.max(0, Math.min(Number(p.xp) || 0, 10_000_000));
  if (p.days && typeof p.days === 'object') {
    for (const [k, v] of Object.entries(p.days).slice(0, 2000)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(k)) out.days[k] = Math.max(0, Math.min(Number(v) || 0, 100000));
    }
  }
  if (p.topics && typeof p.topics === 'object') {
    for (const [k, v] of Object.entries(p.topics).slice(0, 500) as [string, any][]) {
      const a = Math.max(0, Math.min(Number(v?.a) || 0, 1_000_000));
      const c = Math.max(0, Math.min(Number(v?.c) || 0, a));
      out.topics[k.slice(0, 100)] = { a, c };
    }
  }
  if (p.mistakes && typeof p.mistakes === 'object') {
    for (const [k, v] of Object.entries(p.mistakes).slice(0, 5000)) {
      if (/^\d+$/.test(k)) out.mistakes[k] = Number(v) >= 1 ? 1 : 0;
    }
  }
  out.candy = Math.max(0, Math.min(Number(p.candy) || 0, 10_000_000));
  if (Array.isArray(p.items)) out.items = [...new Set(p.items.filter((x: unknown) => typeof x === 'string' && itemById(x)))] as string[];
  const eq = p.equipped && typeof p.equipped === 'object' ? p.equipped : {};
  if (typeof eq.badge === 'string' && itemById(eq.badge)?.kind === 'badge' && out.items.includes(eq.badge)) out.equipped.badge = eq.badge;
  if (typeof eq.fx === 'string' && itemById(eq.fx)?.kind === 'fx' && out.items.includes(eq.fx)) out.equipped.fx = eq.fx;
  return out;
}

export function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? sanitize(JSON.parse(raw)) : empty();
  } catch {
    return empty();
  }
}

// Spojí postup z dvoch zdrojov (napr. z prehliadača a z účtu): nič sa nestratí.
export function merge(a: Progress, b: Progress): Progress {
  const days: Record<string, number> = { ...a.days };
  for (const [k, v] of Object.entries(b.days)) days[k] = Math.max(days[k] ?? 0, v);
  const topics: Record<string, TopicStat> = { ...a.topics };
  for (const [k, v] of Object.entries(b.topics)) {
    const cur = topics[k];
    topics[k] = !cur || v.a > cur.a ? v : cur;
  }
  const mistakes: Record<string, number> = { ...a.mistakes };
  for (const [k, v] of Object.entries(b.mistakes)) mistakes[k] = Math.max(mistakes[k] ?? 0, v);
  const items = [...new Set([...a.items, ...b.items])];
  const equipped = a.equipped.badge || a.equipped.fx ? a.equipped : b.equipped;
  return { xp: Math.max(a.xp, b.xp), days, topics, mistakes, candy: Math.max(a.candy, b.candy), items, equipped };
}

export function save(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // súkromné okno alebo plné úložisko: aplikácia funguje ďalej, postup sa len neuloží
  }
}

export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function topicKey(subject: string, topic: string): string {
  return `${subject}|${topic}`;
}

// Úroveň 2 = 40 XP, úroveň 3 = 160 XP, úroveň 4 = 360 XP, ...
export function levelInfo(xp: number) {
  const level = 1 + Math.floor(Math.sqrt(xp / 40));
  const lo = 40 * (level - 1) ** 2;
  const hi = 40 * level ** 2;
  return { level, into: xp - lo, span: hi - lo };
}

// Počet dní po sebe, v ktorých žiak vyriešil aspoň jednu úlohu. Dnešok sa nepočíta ako prerušenie, kým neskončí.
export function streak(days: Record<string, number>): number {
  const d = new Date();
  if (!days[dayKey(d)]) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days[dayKey(d)]) {
    n += 1;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

// Pri ukladaní na server: XP, dni a témy sa len zväčšujú (spoja sa), zošit chýb berieme od klienta,
// aby sa opravená chyba nevrátila späť.
export function mergeForSave(server: Progress, client: Progress): Progress {
  const m = merge(server, client);
  return { ...m, mistakes: client.mistakes, equipped: client.equipped };
}

export const CANDY_CORRECT = 3;
export const CANDY_COMBO = 2; // bonus od tretej správnej odpovede po sebe
export const CANDY_FIXED = 3; // za opravenú chybu

export function spentCandy(p: Progress): number {
  return p.items.reduce((s, id) => s + (itemById(id)?.price ?? 0), 0);
}
export function candyBalance(p: Progress): number {
  return Math.max(0, p.candy - spentCandy(p));
}
export function buyItem(p: Progress, id: string): Progress | null {
  const it = itemById(id);
  if (!it || p.items.includes(id) || candyBalance(p) < it.price) return null;
  return { ...p, items: [...p.items, id] };
}
export function toggleEquip(p: Progress, id: string): Progress {
  const it = itemById(id);
  if (!it || !p.items.includes(id) || it.kind === 'boost') return p;
  const slot = it.kind === 'badge' ? 'badge' : 'fx';
  const equipped = { ...p.equipped };
  if (equipped[slot] === id) delete equipped[slot];
  else equipped[slot] = id;
  return { ...p, equipped };
}
void ITEMS;

export const XP_CORRECT = 10;
export const XP_COMBO = 5; // bonus od tretej správnej odpovede po sebe
export const XP_TRY = 2; // za pokus
export const XP_FIXED = 10; // za opravenú chybu zo zošita chýb

export function record(
  p: Progress,
  subject: string,
  topic: string,
  id: number,
  ok: boolean,
  combo: number
): { next: Progress; xp: number; fixed: boolean; candy: number } {
  const tk = topicKey(subject, topic);
  const prev = p.topics[tk] ?? { a: 0, c: 0 };
  const today = dayKey();
  const mistakes = { ...p.mistakes };
  let xp = ok ? XP_CORRECT + (combo >= 3 ? XP_COMBO : 0) : XP_TRY;
  let fixed = false;

  const key = String(id);
  if (ok) {
    if (key in mistakes) {
      if (mistakes[key] + 1 >= 2) {
        delete mistakes[key];
        fixed = true;
        xp += XP_FIXED;
      } else {
        mistakes[key] = mistakes[key] + 1;
      }
    }
  } else {
    mistakes[key] = 0;
  }

  xp *= xpMultiplier();
  // cukríky: len počas Halloweenu, len za správne odpovede
  let candy = 0;
  if (ok && halloweenActive()) {
    candy = CANDY_CORRECT + (combo >= 3 ? CANDY_COMBO : 0) + (fixed ? CANDY_FIXED : 0);
    if (p.items.includes(MAGNET)) candy = Math.round(candy * 1.5);
  }
  const next: Progress = {
    ...p,
    candy: p.candy + candy,
    xp: p.xp + xp,
    days: { ...p.days, [today]: (p.days[today] ?? 0) + 1 },
    topics: { ...p.topics, [tk]: { a: prev.a + 1, c: prev.c + (ok ? 1 : 0) } },
    mistakes,
  };
  return { next, xp, fixed, candy };
}

// Najslabšie témy: aspoň 2 pokusy a úspešnosť pod 80 %, najviac tri.
export function weakTopics(p: Progress, subject: string, topics: string[]): string[] {
  return topics
    .map((t) => ({ t, s: p.topics[topicKey(subject, t)] }))
    .filter((x) => x.s && x.s.a >= 2 && x.s.c / x.s.a < 0.8)
    .sort((a, b) => a.s!.c / a.s!.a - b.s!.c / b.s!.a)
    .slice(0, 3)
    .map((x) => x.t);
}
