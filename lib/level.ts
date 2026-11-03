export type Placement = { q: string; o: string[]; c: number };
export const LEVELS = [
  { code: 'A1', name: 'Začiatočník', variant: 'A', text: 'Zvládaš základné slová a jednoduché vety. Začneš testom Základy.' },
  { code: 'A2', name: 'Mierne pokročilý', variant: 'A', text: 'Poznáš základnú gramatiku a bežné slovíčka. Začneš testom Základy a postupne sa posunieš vyššie.' },
  { code: 'B1', name: 'Stredne pokročilý', variant: 'B', text: 'Vieš sa dorozumieť aj v zložitejších vetách. Odporúčame test Stredná úroveň.' },
  { code: 'B2', name: 'Pokročilý', variant: 'C', text: 'Zvládaš aj náročnejšiu gramatiku a texty. Odporúčame test Pokročilá úroveň.' },
] as const;

// 12 úloh, vždy 3 na úroveň (A1, A2, B1, B2)
export const PLACEMENT: Placement[] = [
  { q: 'I ___ a student.', o: ['am', 'is', 'are', 'be'], c: 0 },
  { q: 'She has two ___.', o: ['child', 'childs', 'children', 'childes'], c: 2 },
  { q: '___ is your name?', o: ['Who', 'What', 'Where', 'When'], c: 1 },
  { q: 'Yesterday we ___ pizza for dinner.', o: ['eat', 'ate', 'eaten', 'eating'], c: 1 },
  { q: 'This bag is ___ than that one.', o: ['heavy', 'heavier', 'heaviest', 'more heavy'], c: 1 },
  { q: 'I have lived here ___ 2015.', o: ['for', 'since', 'from', 'during'], c: 1 },
  { q: 'If I had more time, I ___ learn Spanish.', o: ['will', 'would', 'can', 'am'], c: 1 },
  { q: 'The book ___ by millions of people.', o: ['is read', 'reads', 'read', 'is reading'], c: 0 },
  { q: 'She asked me where I ___.', o: ['live', 'lived', 'lives', 'am living'], c: 1 },
  { q: 'By the time we arrived, the film ___ already started.', o: ['has', 'had', 'was', 'have'], c: 1 },
  { q: 'I wish I ___ taller.', o: ['am', 'will be', 'were', 'would be'], c: 2 },
  { q: 'He suggested ___ a taxi.', o: ['to take', 'taking', 'take', 'took'], c: 1 },
];

export const levelFromScore = (s: number) => (s <= 3 ? 1 : s <= 6 ? 2 : s <= 9 ? 3 : 4);

const KEY = 'cvicko-level-v1';
export function readLevel(): { level: number; score: number } | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    return v && v.level >= 1 && v.level <= 4 ? v : null;
  } catch {
    return null;
  }
}
export function saveLevel(level: number, score: number) {
  try { localStorage.setItem(KEY, JSON.stringify({ level, score, at: Date.now() })); } catch {}
}
export function clearLevel() {
  try { localStorage.removeItem(KEY); } catch {}
}
