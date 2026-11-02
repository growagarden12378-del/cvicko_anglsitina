export type Kind = 'abcd' | 'short';

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, '').replace(',', '.');
}

function words(s: string): string[] {
  return (s.toLowerCase().match(/\p{L}+/gu) ?? []).filter(Boolean);
}

function sameWords(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((w, i) => w === b[i]);
}

export function isCorrect(kind: Kind, given: string, correct: string, accepted: string[] = []): boolean {
  if (kind === 'abcd') return given.trim().toUpperCase() === correct.trim().toUpperCase();

  const g = norm(given);
  if (!g) return false;
  const candidates = [correct, ...accepted].map(norm);
  if (candidates.includes(g)) return true;

  // Viacslovné odpovede (napr. „pohoda, radosť, úsmev"): oddeľovače nehrajú rolu, záleží na slovách a ich poradí.
  const gt = words(given);
  if (gt.length >= 2 && [correct, ...accepted].some((c) => sameWords(gt, words(c)))) return true;

  const gn = Number(g);
  if (Number.isNaN(gn)) return false;
  return candidates.some((c) => {
    const n = Number(c);
    return !Number.isNaN(n) && Math.abs(n - gn) < 1e-9;
  });
}
