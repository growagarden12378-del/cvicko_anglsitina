'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { LEVELS, PLACEMENT, levelFromScore, readLevel, saveLevel } from '@/lib/level';

function Test({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(-1); // -1 úvod, 0..n-1 otázky, n výsledok
  const [answers, setAnswers] = useState<number[]>([]);
  const n = PLACEMENT.length;
  const score = answers.filter((a, i) => a === PLACEMENT[i].c).length;
  const level = levelFromScore(score);

  function answer(a: number) {
    const next = [...answers, a];
    setAnswers(next);
    setStep(step + 1);
    if (step + 1 === n) {
      const s = next.filter((x, i) => x === PLACEMENT[i].c).length;
      saveLevel(levelFromScore(s), s);
    }
  }

  return (
    <main className="pl">
      <div className="pl__card">
        {step === -1 && (
          <>
            <h1 className="pl__h">Zisti svoju úroveň 🎯</h1>
            <p>Pred začiatkom ti dáme 12 krátkych úloh od ľahších po ťažšie. Podľa výsledku ti odporučíme správny test.</p>
            <p className="pl__small">Trvá to asi 3 minúty. Ak odpoveď nepoznáš, vyber „Neviem“, nehádaj.</p>
            <button className="btn btn--primary" onClick={() => setStep(0)}>Spustiť test</button>
            <button className="pl__link" onClick={() => { saveLevel(1, 0); onDone(); }}>Preskočiť a začať od základov</button>
          </>
        )}
        {step >= 0 && step < n && (
          <>
            <div className="pl__bar" aria-hidden="true"><i style={{ width: `${(step / n) * 100}%` }} /></div>
            <p className="pl__small">Úloha {step + 1} z {n}</p>
            <h2 className="pl__q">{PLACEMENT[step].q}</h2>
            {PLACEMENT[step].o.map((o, i) => (
              <button key={i} className="pl__opt" onClick={() => answer(i)}>{o}</button>
            ))}
            <button className="pl__link" onClick={() => answer(-1)}>Neviem</button>
          </>
        )}
        {step === n && (
          <>
            <p className="pl__small">Tvoj výsledok: {score} z {n}</p>
            <h1 className="pl__h">Úroveň {LEVELS[level - 1].code}: {LEVELS[level - 1].name}</h1>
            <p>{LEVELS[level - 1].text}</p>
            <button className="btn btn--primary" onClick={onDone}>Začať cvičiť</button>
          </>
        )}
      </div>
    </main>
  );
}

export default function LevelGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<'loading' | 'test' | 'ok'>('loading');
  useEffect(() => { setState(readLevel() ? 'ok' : 'test'); }, []);
  if (state === 'loading') return null;
  if (state === 'test') return <Test onDone={() => setState('ok')} />;
  return <>{children}</>;
}
