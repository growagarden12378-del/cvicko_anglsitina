'use client';

import { useEffect, useState } from 'react';

const KEY = 'tm9-consent-v1';

// Pri prvej návšteve sa žiak musí vyjadriť k podmienkam a ochrane údajov. Bez súhlasu stránku nepoužije.
export default function Consent() {
  const [state, setState] = useState<'loading' | 'ask' | 'declined' | 'ok'>('loading');

  useEffect(() => {
    let ok = false;
    try {
      ok = localStorage.getItem(KEY) === '1';
    } catch {
      // bez úložiska sa opýtame pri každej návšteve
    }
    setState(ok ? 'ok' : 'ask');
  }, []);

  useEffect(() => {
    if (state === 'ok') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [state]);

  function accept() {
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      // ignoruj
    }
    setState('ok');
  }

  if (state === 'ok') return null;
  if (state === 'loading') return <div className="consent" aria-hidden="true" />;

  return (
    <div className="consent" role="dialog" aria-modal="true" aria-labelledby="consent-title">
      <div className="consent__box">
        {state === 'ask' ? (
          <>
            <h2 id="consent-title">Vitaj v Cvičku Angličtina! 👋</h2>
            <p>
              Skôr než začneš, potrebujeme tvoj súhlas s{' '}
              <a href="/podmienky" target="_blank" rel="noopener noreferrer">podmienkami používania</a> a{' '}
              <a href="/ochrana-udajov" target="_blank" rel="noopener noreferrer">zásadami ochrany osobných údajov</a>.
            </p>
            <p className="consent__small">
              Stránka je zadarmo, nepýta si e-mail ani meno a nepoužíva reklamné cookies. Ak máš menej ako 16 rokov,
              povedz o tom rodičom.
            </p>
            <div className="consent__btns">
              <button type="button" className="consent__yes" onClick={accept}>Súhlasím</button>
              <button type="button" className="consent__no" onClick={() => setState('declined')}>Nesúhlasím</button>
            </div>
          </>
        ) : (
          <>
            <h2 id="consent-title">Bez súhlasu to nepôjde 🙁</h2>
            <p>
              Bez súhlasu s podmienkami a ochranou údajov nemôžeš stránku používať. Môžeš si ich prečítať a rozhodnúť
              sa znova.
            </p>
            <div className="consent__btns">
              <button type="button" className="consent__yes" onClick={() => setState('ask')}>Vrátiť sa späť</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
