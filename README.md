# Cvičko 9 – angličtina

Rovnaká aplikácia ako pôvodná (Next.js + Neon), ale len s angličtinou.

1. `cp .env.example .env.local` a vlož `DATABASE_URL`. Použi **novú** databázu: stará má v tabuľke `tests` obmedzenie len na predmety `mat` a `sj`.
2. `npm install`
3. `npm run db:migrate` a `npm run db:seed`
4. `npm run dev` a otvor http://localhost:3000/anglictina

Úlohy sú v `seed/aj-2026-A.json` (30 úloh, 6 tém). Ďalšie testy pridávaš ako nové JSON súbory v rovnakom tvare (`"subject": "aj"`) a znova spustíš `npm run db:seed`. Texty zápisníka (zhrnutia tém) sú v `lib/journal.ts`.
