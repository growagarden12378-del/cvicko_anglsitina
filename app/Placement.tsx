'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { CEFR } from '@/lib/cefr';
import { BLOCK, PASS, PLACEMENT, applyPlacement, levelFromBlocks, readLevel, saveLevel } from '@/lib/level';

function Test({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(-1); // -1 úvod, 0.. otázky
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<number | null>(null); // dosiahnutá úroveň (1..5)

  function finish(passed: number) {
    const level = levelFromBlocks(passed);
    saveLevel(level);
    applyPlacement(level);
    setResult(level);
  }

  function answer(a: number) {
    const next = [...answers, a];
    setAnswers(next);
    const idx = step;
    if (idx % BLOCK === BLOCK - 1) {
      const block = Math.floor(idx / BLOCK);
      const ok = next.slice(block * BLOCK, block * BLOCK + BLOCK).filter((x, i) => x === PLACEMENT[block * BLOCK + i].c).length;
      if (ok < PASS) return finish(block); // blok sa nepodaril: skončili sme
      if (idx + 1 >= PLACEMENT.length) return finish(block + 1); // zvládol všetko
    }
    setStep(idx + 1);
  }

  const lv = result ? CEFR[result - 1] : null;

  return (
    <main className="pl">
      <div className="pl__card">
        {step === -1 && result === null && (
          <>
            <h1 className="pl__h">Zisti svoju úroveň 🎯</h1>
            <p>Test začína ľahko a postupne sa sťažuje, až po úroveň C1. Skončí, keď prídu úlohy, ktoré sú pre teba príliš ťažké. Môže mať až 25 úloh.</p>
            <p className="pl__small">Hádanie ti nepomôže, lebo by ti určilo vyššiu úroveň, než zvládaš. Ak odpoveď nepoznáš, vyber „Neviem“.</p>
            <button className="btn btn--primary" onClick={() => setStep(0)}>Spustiť test</button>
            <button className="pl__link" onClick={() => { saveLevel(1); onDone(); }}>Preskočiť a začať od A1</button>
          </>
        )}
        {step >= 0 && result === null && (
          <>
            <div className="pl__bar" aria-hidden="true"><i style={{ width: `${(step / PLACEMENT.length) * 100}%` }} /></div>
            <p className="pl__small">Úloha {step + 1}</p>
            <h2 className="pl__q">{PLACEMENT[step].q}</h2>
            {PLACEMENT[step].o.map((o, i) => (
              <button key={i} className="pl__opt" onClick={() => answer(i)}>{o}</button>
            ))}
            <button className="pl__link" onClick={() => answer(-1)}>Neviem</button>
          </>
        )}
        {lv && (
          <>
            <p className="pl__small">Tvoja úroveň</p>
            <h1 className="pl__h">{lv.code} – {lv.name}</h1>
            <p>
              {result! <= 2
                ? 'Dostaneš jednoduchšie úlohy a pri každej podrobné vysvetlenie s prekladom.'
                : 'Dostaneš náročnejšie úlohy a vysvetlenia sa sústredia na pasce a výnimky.'}
            </p>
            <p className="pl__small">
              {result! < CEFR.length
                ? `Na ďalšiu úroveň (${CEFR[result!].code}) potrebuješ ${CEFR[result!].from.toLocaleString('sk')} XP. XP získavaš správnymi odpoveďami.`
                : 'Máš najvyššiu úroveň, tak sa ju snaž udržať.'}
            </p>
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
