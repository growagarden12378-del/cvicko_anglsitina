'use client';

import { useEffect, useRef, useState } from 'react';

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

// ---- vlastná zvuková slučka (generovaná, bez hudobných súborov): pomalý akordový podklad a jemné arpeggio
function startLoop(): () => void {
  const AC = window.AudioContext || (window as any).webkitAudioContext;
  const ctx: AudioContext = new AC();
  const master = ctx.createGain();
  master.gain.setValueAtTime(0, ctx.currentTime);
  master.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 1.5);
  master.connect(ctx.destination);

  const beat = 60 / 76;
  const bar = beat * 4;
  const chords = [
    [220.0, 261.63, 329.63], // Am
    [174.61, 220.0, 261.63], // F
    [261.63, 329.63, 392.0], // C
    [196.0, 246.94, 293.66], // G
  ];
  const note = (f: number, t: number, dur: number, type: OscillatorType, vol: number, attack = 0.02) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + dur + 0.05);
  };

  let next = ctx.currentTime + 0.1;
  let timer: ReturnType<typeof setTimeout>;
  const schedule = () => {
    chords.forEach((c, b) => {
      const t0 = next + b * bar;
      note(c[0] / 2, t0, bar * 0.98, 'sine', 0.35, 0.3); // bas
      c.forEach((f) => note(f, t0, bar * 0.98, 'sine', 0.12, 0.6)); // pad
      const pat = [0, 1, 2, 1, 0, 1, 2, 1];
      pat.forEach((i, k) => note(c[i] * 2, t0 + k * (beat / 2), beat * 0.9, 'triangle', 0.1)); // arpeggio
    });
    next += chords.length * bar;
    timer = setTimeout(schedule, Math.max(0, (next - ctx.currentTime - 1) * 1000));
  };
  schedule();

  return () => {
    clearTimeout(timer);
    try {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
      setTimeout(() => ctx.close().catch(() => {}), 500);
    } catch {
      // ignoruj
    }
  };
}

export default function Loader({ label }: { label: string }) {
  const [snake, setSnake] = useState(false);
  const [tip, setTip] = useState<number | null>(null);
  const [sound, setSound] = useState(false);
  const stop = useRef<null | (() => void)>(null);

  // náhodný výber až v prehliadači, aby sa server a prehliadač nelíšili (1 % šanca na hada, ?snake=1 ho vynúti)
  useEffect(() => {
    const forced = new URLSearchParams(window.location.search).get('snake') === '1';
    setSnake(forced || Math.random() < 0.01);
    setTip(Math.floor(Math.random() * TIPS.length));
    return () => stop.current?.();
  }, []);

  useEffect(() => {
    if (tip === null || snake) return;
    const t = setInterval(() => setTip((i) => ((i ?? 0) + 1) % TIPS.length), 5000);
    return () => clearInterval(t);
  }, [tip === null, snake]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleSound() {
    if (sound) {
      stop.current?.();
      stop.current = null;
      setSound(false);
    } else {
      try {
        stop.current = startLoop();
        setSound(true);
      } catch {
        // zvuk nie je dostupný
      }
    }
  }

  return (
    <div className="ld" role="status" aria-live="polite">
      {snake ? (
        <div className="ld__stage">
          <img className="ld__img" src="/ouroboros.png" alt="" width={420} height={420} />
          <span className="ld__ico ld__ico--tr"><IconLoop /></span>
          <span className="ld__ico ld__ico--br"><IconRecycle /></span>
          <span className="ld__ico ld__ico--bl"><IconHourglass /></span>
          <span className="ld__ico ld__ico--tl"><IconScales /></span>
          <button type="button" className="ld__sound" onClick={toggleSound} aria-pressed={sound} aria-label={sound ? 'Vypnúť hudbu' : 'Zapnúť hudbu'} title={sound ? 'Vypnúť hudbu' : 'Zapnúť hudbu'}>
            {sound ? '🔊' : '🔇'}
          </button>
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
