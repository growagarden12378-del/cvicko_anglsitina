'use client';

import { useEffect, useState } from 'react';

const TIPS = [
  'Nové slovo si povedz nahlas aj vo vete, zapamätáš si ho oveľa lepšie.',
  'Pri he/she/it v present simple nezabudni na príponu -s.',
  'Päť minút denne je lepších ako hodina raz za týždeň.',
  'Chyba nie je problém: zapíše sa do zošita chýb a môžeš si ju neskôr opraviť.',
  'Pozeraj seriály v angličtine s anglickými titulkami.',
  'Nepravidelné slovesá sa učia po skupinách: go – went – gone, see – saw – seen.',
  'Pred presným časom používame at, pred dňom on a pred mesiacom in.',
  'A/an závisí od zvuku, nie od písmena: an hour, a university.',
  'Slová sa učia vo frázach: make a mistake, do homework.',
  'Preklad slovo po slove nefunguje. Uč sa radšej celé frázy.',
  'Počúvaj anglické piesne a skús pochopiť, o čom sú.',
  'Pri čítaní s porozumením si najprv prečítaj otázku a potom text.',
];
const SNAKE_TIP = 'Tip: The loop never ends. 🐍';

// Najkratšia doba zobrazenia načítavania (ms), aj keď sú úlohy hotové skôr. Zmeň podľa chuti.
export const RING_MIN_MS = 4000; // točiaci sa kruh
export const SNAKE_MIN_MS = 9000; // had: aspoň jeden celý cyklus symbolov (8 s)

// Výber (kruh/had, tip) sa urobí raz na prehliadači, aby sa Loader aj odpočet zhodovali
let choice: { snake: boolean; tip: number } | null = null;
function getChoice() {
  if (!choice) {
    const forced = new URLSearchParams(window.location.search).get('snake') === '1';
    choice = { snake: forced || Math.random() < 0.01, tip: Math.floor(Math.random() * TIPS.length) };
  }
  return choice;
}

// Vráti true, až keď uplynul minimálny čas načítavania
export function useLoadingMin(): boolean {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), getChoice().snake ? SNAKE_MIN_MS : RING_MIN_MS);
    return () => clearTimeout(t);
  }, []);
  return done;
}

// ---- ikonky (čierne, so žiarou), v poradí ako v animácii: pravý horný, pravý dolný, ľavý dolný, ľavý horný
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 4, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
function IconLoop() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M38 14 A16 16 0 1 0 40 26" {...S} />
      <path d="M40 5 V16 H29" {...S} />
    </svg>
  );
}
function IconRecycle() {
  const arrow = (
    <g>
      <path d="M9 32 L20 12" {...S} />
      <path d="M13 11 L21 10 L22 19" {...S} />
    </g>
  );
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <g transform="translate(0 2)">
        {arrow}
        <g transform="rotate(120 24 28)">{arrow}</g>
        <g transform="rotate(240 24 28)">{arrow}</g>
      </g>
    </svg>
  );
}
function IconHourglass() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M12 5 H36 M12 43 H36" {...S} />
      <path d="M14 5 C14 18 22 20 24 24 C26 28 34 30 34 43 H14 C14 30 22 28 24 24 C26 20 34 18 34 5 Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
function IconScales() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M24 7 V40 M14 43 H34 M7 13 H41" {...S} />
      <path d="M7 13 L2 29 M7 13 L14 29 M41 13 L34 29 M41 13 L46 29" {...S} strokeWidth={2.5} />
      <path d="M1 29 H15 A7 6 0 0 1 1 29 Z M33 29 H47 A7 6 0 0 1 33 29 Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export default function Loader({ label }: { label: string }) {
  const [snake, setSnake] = useState(false);
  const [tip, setTip] = useState<number | null>(null);

  // náhodný výber až v prehliadači, aby sa server a prehliadač nelíšili (1 % šanca na hada, ?snake=1 ho vynúti)
  useEffect(() => {
    const c = getChoice();
    setSnake(c.snake);
    setTip(c.tip);
  }, []);

  useEffect(() => {
    if (tip === null || snake) return;
    const t = setInterval(() => setTip((i) => ((i ?? 0) + 1) % TIPS.length), 5000);
    return () => clearInterval(t);
  }, [tip === null, snake]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="ld" role="status" aria-live="polite">
      {snake ? (
        <div className="ld__stage">
          <img className="ld__img" src="/ouroboros.png" alt="" width={420} height={420} />
          <span className="ld__ico ld__ico--tr"><IconLoop /></span>
          <span className="ld__ico ld__ico--br"><IconRecycle /></span>
          <span className="ld__ico ld__ico--bl"><IconHourglass /></span>
          <span className="ld__ico ld__ico--tl"><IconScales /></span>
        </div>
      ) : (
        <div className="ld__ring" aria-hidden="true">
          <span className="ld__arc" />
          <span className="ld__dot" />
        </div>
      )}
      <p className="ld__label">{label}</p>
      <p className="ld__tip" key={snake ? 'snake' : tip}>
        {tip === null ? '' : snake ? SNAKE_TIP : `Tip: ${TIPS[tip]}`}
      </p>
    </div>
  );
}
