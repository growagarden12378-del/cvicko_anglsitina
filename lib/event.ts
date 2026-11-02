// Halloweenska udalosť: automaticky od 25. októbra do 3. novembra každý rok.
// Na vyskúšanie kedykoľvek: ?halloween=1 (zapne), ?halloween=0 (vypne)
export const EVENT_XP_MULTIPLIER = 2;

let override: boolean | null | undefined; // undefined = ešte sa nezisťovalo

function readOverride(): boolean | null {
  if (override !== undefined) return override;
  override = null;
  try {
    if (typeof window !== 'undefined') {
      const q = new URLSearchParams(window.location.search).get('halloween');
      if (q === '1') override = true;
      else if (q === '0') override = false;
    }
  } catch {
    // ignoruj
  }
  return override;
}

export function halloweenActive(now: Date = new Date()): boolean {
  const o = readOverride();
  if (o !== null) return o;
  const m = now.getMonth(); // 0 = január
  const d = now.getDate();
  return (m === 9 && d >= 25) || (m === 10 && d <= 3);
}

export function xpMultiplier(): number {
  return halloweenActive() ? EVENT_XP_MULTIPLIER : 1;
}

export const EVENT_END_TEXT = 'do 3. novembra';
