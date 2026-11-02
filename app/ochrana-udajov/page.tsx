import LegalPage from '../LegalPage';
import { CONTACT_EMAIL, LEGAL_UPDATED, OPERATOR_NAME } from '@/lib/config';

export const metadata = { title: 'Ochrana osobných údajov – Cvičko 9' };

export default function Page() {
  return (
    <LegalPage title="Ochrana osobných údajov">
      <p className="legal__date">Posledná aktualizácia: {LEGAL_UPDATED}</p>
      <p>
        Chceme zbierať čo najmenej údajov. Stránku môžeš používať úplne bez účtu a vtedy o tebe nezbierame nič, čo by
        sme vedeli spojiť s tvojou osobou.
      </p>

      <h2>1. Prevádzkovateľ</h2>
      <p>{OPERATOR_NAME}. Kontakt na otázky k údajom: {CONTACT_EMAIL}.</p>

      <h2>2. Aké údaje spracúvame a prečo</h2>
      <h3>Bez účtu</h3>
      <p>
        Tvoj postup (body, séria, zápisník chýb, cukríky, kúpené doplnky) sa ukladá iba v úložisku tvojho prehliadača
        (localStorage) vo tvojom zariadení. Na náš server sa neodosiela. Vymažeš ho vymazaním údajov stránky v
        prehliadači.
      </p>
      <h3>S účtom</h3>
      <ul>
        <li><b>Prezývka</b> (používateľské meno): aby si sa mohol prihlásiť a aby ťa videl rebríček.</li>
        <li><b>Heslo</b>: ukladáme ho iba ako nevratný kryptografický odtlačok (hash). Pôvodné heslo nepoznáme.</li>
        <li>
          <b>Tvoj postup</b> (body, aktivita podľa dní, štatistiky tém, zápisník chýb, cukríky, kúpené doplnky): aby
          sa synchronizoval medzi zariadeniami a zobrazil v rebríčku.
        </li>
        <li><b>Prihlasovací cookie</b>: pozri bod 4.</li>
      </ul>
      <p>E-mail, skutočné meno, vek ani polohu sa od teba nepýtame. Prosíme, nepoužívaj ich ani v prezývke.</p>

      <h2>3. Právny základ</h2>
      <p>
        Účet a súvisiace údaje spracúvame na základe tvojho súhlasu (vytvorenie účtu) a na poskytovanie funkcií, o
        ktoré si požiadal (čl. 6 ods. 1 písm. a) a b) nariadenia GDPR). Technické záznamy hostingu vznikajú na základe
        nášho oprávneného záujmu na bezpečnosti a prevádzke stránky. Ak je ti menej ako 16 rokov, potrebujeme súhlas
        rodiča alebo zákonného zástupcu.
      </p>

      <h2>4. Cookies a úložisko prehliadača</h2>
      <ul>
        <li>
          <b>Prihlasovací cookie</b> (<code>tm9_session</code>): nevyhnutný, zabezpečený, nastaví sa iba po
          prihlásení, platí 90 dní alebo do odhlásenia. Slúži iba na udržanie prihlásenia.
        </li>
        <li>
          <b>localStorage</b>: ukladá tvoj postup a drobné nastavenia vo tvojom prehliadači. Je nevyhnutné pre
          fungovanie stránky.
        </li>
      </ul>
      <p>Nepoužívame reklamné ani analytické cookies a nesledujeme ťa naprieč webmi.</p>

      <h2>5. Kto údaje spracúva za nás</h2>
      <ul>
        <li><b>Vercel Inc.</b> (hosting stránky): môže automaticky zaznamenávať technické údaje o návšteve, napríklad IP adresu.</li>
        <li><b>Neon</b> (databáza): uchováva prezývku, hash hesla a postup.</li>
      </ul>
      <p>
        Títo poskytovatelia môžu údaje spracúvať aj mimo EÚ (najmä v USA) na základe štandardných zmluvných doložiek
        alebo iných záruk podľa GDPR. Údaje nepredávame ani neposkytujeme inak na reklamné účely.
      </p>
      <p>
        Odkaz „Prispieť“ vedie na Revolut, ktorý je samostatným prevádzkovateľom a platbu spracúva podľa svojich
        zásad. Od Revolutu žiadne údaje o platiteľoch nezískavame.
      </p>

      <h2>6. Čo je verejné</h2>
      <p>
        V rebríčku sa verejne zobrazuje tvoja prezývka, body (XP) a nasadený odznak. Ostatné údaje (heslo, zápisník
        chýb, štatistiky) nie sú verejné.
      </p>

      <h2>7. Ako dlho údaje uchovávame</h2>
      <p>
        Údaje účtu uchovávame, kým účet existuje. Po jeho zrušení ich do 30 dní vymažeme. Technické záznamy hostingu
        uchováva Vercel podľa vlastných lehôt.
      </p>

      <h2>8. Tvoje práva</h2>
      <p>
        Máš právo na prístup k údajom, ich opravu, vymazanie, obmedzenie spracúvania, prenosnosť a právo namietať.
        Súhlas môžeš kedykoľvek odvolať. Stačí napísať na {CONTACT_EMAIL}. Pre istotu uveď prezývku, ktorú máš na
        stránke, aby sme účet našli. Máš tiež právo podať sťažnosť Úradu na ochranu osobných údajov Slovenskej
        republiky (dataprotection.gov.sk).
      </p>

      <h2>9. Bezpečnosť</h2>
      <p>
        Komunikácia so stránkou je šifrovaná (HTTPS), heslá sa ukladajú iba ako hash a prihlasovací cookie nie je
        čitateľný z JavaScriptu. Žiadny systém nie je dokonalý, preto si zvoľ unikátne heslo, ktoré nepoužívaš
        inde.
      </p>

      <h2>10. Deti</h2>
      <p>
        Stránka je určená žiakom 9. ročníka, ktorí môžu mať menej ako 16 rokov. Preto nepýtame žiadne údaje navyše a
        účet je dobrovoľný. Mladší ako 16 rokov si ho vytvor so súhlasom rodiča alebo zákonného zástupcu. Ak sa
        dozvieme, že účet vznikol bez takéhoto súhlasu, môžeme ho zrušiť.
      </p>

      <h2>11. Zmeny</h2>
      <p>Tieto zásady môžeme aktualizovať. Aktuálne znenie je vždy na tejto adrese.</p>

      <p>
        Pravidlá používania nájdeš v <a href="/podmienky">Podmienkach používania</a>.
      </p>
    </LegalPage>
  );
}
