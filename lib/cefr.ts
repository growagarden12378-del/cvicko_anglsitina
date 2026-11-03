// Úrovne angličtiny (CEFR). „from“ = koľko XP celkovo treba na dosiahnutie úrovne.
// Posun o úroveň je zámerne náročný: pri ~100–150 XP denne ide o týždne cvičenia.
export const CEFR = [
  { code: 'A1', name: 'Začiatočník', from: 0 },
  { code: 'A2', name: 'Mierne pokročilý', from: 2000 },
  { code: 'B1', name: 'Stredne pokročilý', from: 6000 },
  { code: 'B2', name: 'Pokročilý', from: 13000 },
  { code: 'C1', name: 'Expert', from: 23000 },
] as const;

export const LEVEL_CODES: string[] = CEFR.map((l) => l.code);

// Z ktorých úrovní úloh sa žiakovi dávajú náhodné cvičenia: jeho úroveň a o stupeň vyššia.
export function poolFor(level: number): string[] {
  const i = Math.min(Math.max(level, 1), CEFR.length) - 1;
  return i >= CEFR.length - 1 ? [CEFR[i - 1].code, CEFR[i].code] : [CEFR[i].code, CEFR[i + 1].code];
}
