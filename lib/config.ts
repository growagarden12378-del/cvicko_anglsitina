// Odkaz, kam vedie žlté tlačidlo „Prispieť“ na konci stránky.
// Zmeníš ho bez úpravy kódu: vo Verceli (Settings → Environment Variables) pridaj
// NEXT_PUBLIC_DONATE_URL a potom stránku znova nasaď (Redeploy). Ak nie je nastavená, použije sa odkaz nižšie.
export const DONATE_URL = process.env.NEXT_PUBLIC_DONATE_URL || 'https://revolut.me/oleksi5n1c';

// Ikonka stránky (v záložke prehliadača): 'halloween' alebo 'normal'.
// Po zmene stránku nasaď znova. Súbory sú v public/icon-halloween.* a public/icon-normal.*
export const SITE_ICON: 'halloween' | 'normal' = 'halloween';

// Údaje prevádzkovateľa pre stránky Podmienky a Ochrana údajov. Nastav v premenných prostredia na Verceli
// (NEXT_PUBLIC_OPERATOR_NAME, NEXT_PUBLIC_CONTACT_EMAIL) alebo prepíš priamo tu.
export const OPERATOR_NAME = process.env.NEXT_PUBLIC_OPERATOR_NAME || 'Oleksii Futsur (prevádzkovateľ stránky Cvičko 9)';
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'ovfutsur@gmail.com';
export const LEGAL_UPDATED = '31. októbra 2026';
