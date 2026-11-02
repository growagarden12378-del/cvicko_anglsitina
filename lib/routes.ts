export type Mode = 'topics' | 'test' | 'mistakes';

export const SUBJECT_PATH: Record<string, string> = { aj: 'anglictina' };
export const MODE_PATH: Record<Mode, string> = { topics: '', test: '/testy', mistakes: '/chyby' };

export type View = 'home' | 'session' | 'results' | 'journal' | 'shop';

// Adresa v prehliadači sleduje, kde si:
// /anglictina, /anglictina/testy, /anglictina/chyby, /trening, /test, /vysledky, /zapisnik
export function pathFor(view: View, subject: string, mode: Mode, fullTest: boolean): string {
  if (view === 'journal') return '/zapisnik';
  if (view === 'shop') return '/obchod';
  if (view === 'results') return '/vysledky';
  if (view === 'session') return fullTest ? '/test' : '/trening';
  return '/' + (SUBJECT_PATH[subject] ?? 'anglictina') + MODE_PATH[mode];
}

export function parsePath(path: string): { view: View; subject?: string; mode?: Mode } {
  const seg = path.split('/').filter(Boolean);
  if (seg[0] === 'zapisnik') return { view: 'journal' };
  if (seg[0] === 'obchod') return { view: 'shop' };
  if (seg[0] === 'trening' || seg[0] === 'test') return { view: 'session' };
  if (seg[0] === 'vysledky') return { view: 'results' };
  const subject = Object.keys(SUBJECT_PATH).find((k) => SUBJECT_PATH[k] === seg[0]);
  const mode = (Object.keys(MODE_PATH) as Mode[]).find((m) => MODE_PATH[m] === (seg[1] ? '/' + seg[1] : ''));
  return { view: 'home', subject, mode };
}

