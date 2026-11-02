import Link from 'next/link';
import type { ReactNode } from 'react';

export default function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="legal">
      <Link href="/" className="legal__back">← Späť na Cvičko 9</Link>
      <article className="legal__box">
        <h1>{title}</h1>
        {children}
        <p className="legal__nav">
          <Link href="/podmienky">Podmienky používania</Link> · <Link href="/ochrana-udajov">Ochrana osobných údajov</Link>
        </p>
      </article>
    </main>
  );
}
