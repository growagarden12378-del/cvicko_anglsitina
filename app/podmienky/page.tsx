import LegalPage from '../LegalPage';
import { CONTACT_EMAIL, LEGAL_UPDATED, OPERATOR_NAME } from '@/lib/config';

export const metadata = { title: 'Podmienky používania – Cvičko 9' };

export default function Page() {
  return (
    <LegalPage title="Podmienky používania">
      <p className="legal__date">Posledná aktualizácia: {LEGAL_UPDATED}</p>
      <p>
        Cvičko 9 (ďalej „stránka“) je bezplatná stránka na precvičovanie úloh na Testovanie 9. Používaním stránky
        súhlasíš s týmito podmienkami. Ak nesúhlasíš, stránku, prosím, nepoužívaj.
      </p>

      <h2>1. Kto stránku prevádzkuje</h2>
      <p>{OPERATOR_NAME}. Kontakt: {CONTACT_EMAIL}.</p>

      <h2>2. Neoficiálna stránka a zdroj úloh</h2>
      <p>
        Stránka je neoficiálna a nie je spojená so žiadnou školou ani štátnou inštitúciou. Úlohy z oficiálnych testov
        sú materiály NIVaM (Národný inštitút vzdelávania a mládeže), Bratislava, ktorý je ich výhradným autorom a
        zdrojom. Všetky práva k nim patria NIVaM. Ak sme niektorú úlohu vytvorili sami, je pri nej výslovne uvedené,
        že nepochádza z originálneho testu.
      </p>

      <h2>3. Čo stránka ponúka</h2>
      <p>
        Cvičné úlohy, kontrolu odpovedí, zápisník chýb, body (XP), rebríček a v čase tematických udalostí aj virtuálne
        cukríky a obchod s kozmetickými doplnkami. Cukríky a kúpené doplnky nemajú žiadnu peňažnú hodnotu, nedajú sa
        vymeniť za peniaze ani tovar a môžu sa kedykoľvek zmeniť alebo zrušiť.
      </p>

      <h2>4. Žiadna záruka</h2>
      <p>
        Stránka slúži iba na precvičovanie. Snažíme sa, aby boli úlohy a správne odpovede presné, no chyby sa môžu
        vyskytnúť a nezaručujeme ich správnosť, úplnosť ani to, že stránka pobeží bez výpadkov. Výsledky na stránke
        nepredpovedajú ani nezaručujú výsledok skutočného testu. Stránka sa poskytuje „tak, ako je“.
      </p>

      <h2>5. Účet</h2>
      <p>
        Účet je dobrovoľný. Stačí prezývka a heslo, e-mail ani skutočné meno nepotrebuješ, a odporúčame ich ako
        prezývku nepoužívať. Heslo chráň a nezdieľaj ho. Za aktivitu na svojom účte zodpovedáš ty. Ak je ti menej ako
        16 rokov, vytvor si účet len so súhlasom rodiča alebo zákonného zástupcu.
      </p>

      <h2>6. Pravidlá správania</h2>
      <p>Neprezývaj sa vulgárne ani urážlivo, nevydávaj sa za iných a nepoužívaj cudzie osobné údaje. Zakázané je tiež:</p>
      <ul>
        <li>narúšať chod stránky alebo ju preťažovať (automatizované dotazy, útoky, pokusy o prienik),</li>
        <li>obchádzať obmedzenia či upravovať údaje tak, aby si získal body alebo cukríky nepoctivo,</li>
        <li>hromadne sťahovať alebo ďalej šíriť úlohy zo stránky.</li>
      </ul>
      <p>
        Prevádzkovateľ môže bez upozornenia upraviť alebo zmazať prezývku, vynulovať nepoctivo získané body, alebo
        zablokovať či zrušiť účet, ktorý tieto pravidlá porušuje.
      </p>

      <h2>7. Rebríček</h2>
      <p>
        Ak máš účet, tvoja prezývka, body (XP) a nasadený odznak sa zobrazujú v rebríčku všetkým návštevníkom stránky.
        Preto si nevyberaj prezývku, ktorá by ťa mohla identifikovať.
      </p>

      <h2>8. Dobrovoľná podpora</h2>
      <p>
        Odkaz „Prispieť“ vedie na externú službu (Revolut). Príspevok je dobrovoľný darček, na žiadnu protihodnotu
        nevzniká nárok a nemá vplyv na body, cukríky ani iné funkcie stránky. Platbu spracúva tretia strana podľa
        svojich podmienok.
      </p>

      <h2>9. Zodpovednosť</h2>
      <p>
        Prevádzkovateľ nezodpovedá za škody vzniknuté používaním stránky alebo jej nedostupnosťou, vrátane straty
        uloženého postupu, v rozsahu, v akom to dovoľuje právny poriadok. Tým nie sú dotknuté práva, ktoré zákon
        vylúčiť neumožňuje.
      </p>

      <h2>10. Zmeny a ukončenie</h2>
      <p>
        Stránku, jej funkcie aj tieto podmienky môžeme kedykoľvek zmeniť alebo stránku ukončiť. Aktuálne znenie je vždy
        na tejto adrese a platí od dátumu uvedeného vyššie. Účet môžeš kedykoľvek zrušiť, napíš na {CONTACT_EMAIL}.
      </p>

      <h2>11. Rozhodné právo</h2>
      <p>Tieto podmienky sa riadia právom Slovenskej republiky.</p>

      <p>
        Spracúvanie osobných údajov popisuje stránka <a href="/ochrana-udajov">Ochrana osobných údajov</a>.
      </p>
    </LegalPage>
  );
}
