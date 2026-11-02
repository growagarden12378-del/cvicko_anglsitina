// Obsah zápisníka: krátke zhrnutie každej témy + kresbička.
// Nová téma v databáze bez záznamu tu sa v zápisníku zobrazí tiež (len so zoznamom chýb).

export type Stroke = { d: string; c?: 'red' | 'teal' };
export type Entry = {
  hook: string; // červený riadok pod nadpisom
  summary: string; // krátke zhrnutie
  rule: string; // tyrkysová poznámka pod kresbou
  tips: string[]; // tipy na pravej strane
  example?: string; // príklad v rámčeku
  doodle: string; // kľúč do DOODLES
};

// Kresbičky sú nakreslené jedným ťahom v štvorci 100 × 100.
const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0`;

export const DOODLES: Record<string, Stroke[]> = {
  cisla: [
    { d: 'M8 64 H92' },
    { d: 'M20 58 V70 M40 58 V70 M60 58 V70 M80 58 V70' },
    { d: 'M86 58 L92 64 L86 70' },
    { d: circle(60, 40, 7), c: 'red' },
    { d: 'M60 47 V57', c: 'red' },
    { d: 'M14 30 L20 24 V40 M32 26 Q40 22 40 30 Q40 34 32 40 H42' },
  ],
  delitelnost: [
    { d: 'M22 50 H78' },
    { d: circle(50, 26, 5) },
    { d: circle(50, 74, 5) },
    { d: 'M14 46 C12 20 44 8 70 16 C92 24 92 60 76 78 C58 94 24 88 14 60', c: 'red' },
  ],
  zlomky: [
    { d: circle(50, 50, 34) },
    { d: 'M50 50 V16 M50 50 L80 67 M50 50 L20 67' },
    { d: 'M30 70 L56 70 M36 78 L62 78 M44 85 L56 85', c: 'red' },
  ],
  percenta: [
    { d: circle(27, 28, 9) },
    { d: circle(73, 72, 9) },
    { d: 'M80 18 L20 82', c: 'red' },
  ],
  pomer: [
    { d: 'M50 16 V84 M32 86 H68' },
    { d: 'M20 30 H80' },
    { d: 'M20 30 L10 56 M20 30 L30 56 M8 56 Q20 68 32 56' },
    { d: 'M80 30 L70 56 M80 30 L90 56 M68 56 Q80 68 92 56', c: 'red' },
  ],
  vyrazy: [
    { d: 'M12 34 L34 66 M34 34 L12 66' },
    { d: 'M46 42 H68 M46 58 H68', c: 'teal' },
    { d: 'M76 38 Q84 28 92 38 Q92 46 84 52 V60 M84 70 V72', c: 'red' },
  ],
  uhly: [
    { d: 'M12 82 L88 82 L46 18 Z' },
    { d: 'M32 82 Q32 74 25 70', c: 'red' },
    { d: 'M68 82 Q68 74 76 70', c: 'red' },
    { d: 'M39 36 Q46 44 53 36', c: 'red' },
  ],
  obsahy: [
    { d: 'M16 32 H84 V74 H16 Z' },
    { d: 'M16 20 H84 M16 15 V25 M84 15 V25', c: 'teal' },
    { d: 'M92 32 V74 M87 32 H97 M87 74 H97', c: 'teal' },
    { d: 'M24 68 L40 38 M40 68 L56 38 M56 68 L72 38 M70 68 L78 52', c: 'red' },
  ],
  kruh: [
    { d: circle(50, 50, 34) },
    { d: 'M50 50 L84 50', c: 'red' },
    { d: circle(50, 50, 2) },
    { d: 'M60 40 V34 M60 36 Q64 32 69 34', c: 'teal' },
  ],
  objemy: [
    { d: 'M16 40 H60 V84 H16 Z' },
    { d: 'M16 40 L34 22 H78 L60 40' },
    { d: 'M60 84 L78 66 V22' },
    { d: 'M24 52 L52 52 M24 62 L52 62 M24 72 L44 72', c: 'red' },
  ],
  statistika: [
    { d: 'M10 88 H92 M10 88 V12' },
    { d: 'M18 86 V58 H34 V86 M42 86 V36 H58 V86 M66 86 V48 H82 V86' },
    { d: 'M10 52 H92', c: 'red' },
  ],
  kombinatorika: [
    { d: 'M50 16 L24 46 M50 16 L50 46 M50 16 L76 46' },
    { d: 'M24 46 L14 78 M24 46 L34 78 M50 46 L42 78 M50 46 L58 78 M76 46 L68 78 M76 46 L86 78' },
    { d: circle(50, 14, 4), c: 'red' },
  ],
  logicke: [
    { d: 'M50 12 C30 12 22 30 30 44 C36 54 38 58 38 66 H62 C62 58 64 54 70 44 C78 30 70 12 50 12 Z' },
    { d: 'M40 74 H60 M42 82 H58 M45 90 H55' },
    { d: 'M43 34 Q50 24 57 34 Q57 40 50 44 V50 M50 57 V58', c: 'red' },
  ],
  priestor: [
    { d: 'M38 12 H62 V36 H38 Z M38 36 H62 V60 H38 Z M38 60 H62 V84 H38 Z M14 36 H38 V60 H14 Z M62 36 H86 V60 H62 Z' },
    { d: 'M70 14 Q92 14 90 32 M85 28 L90 33 L95 27', c: 'red' },
  ],
  slovne: [
    { d: 'M12 20 H88 V62 H54 L34 82 V62 H12 Z' },
    { d: 'M22 32 H76 M22 42 H68' },
    { d: 'M22 52 H52', c: 'red' },
  ],
  citanie: [
    { d: 'M48 26 C36 18 22 18 10 22 V72 C22 68 36 68 48 76 C60 68 74 68 86 72 V22 C74 18 60 18 48 26 Z M48 26 V76' },
    { d: 'M18 34 H40 M18 44 H40 M18 54 H36' },
    { d: circle(68, 50, 11), c: 'red' },
    { d: 'M76 58 L90 72', c: 'red' },
  ],
  skladba: [
    { d: 'M8 18 H40 V40 H8 Z' },
    { d: 'M60 18 H92 V40 H60 Z' },
    { d: 'M40 29 H60 M54 23 L60 29 L54 35', c: 'teal' },
    { d: 'M34 64 H66 V86 H34 Z' },
    { d: 'M76 40 V52 H50 V64 M45 58 L50 64 L55 58', c: 'red' },
  ],
  pravopis: [
    { d: 'M18 80 L24 60 L66 18 L82 34 L40 76 Z M60 24 L76 40 M24 60 L40 76' },
    { d: 'M52 90 Q58 82 64 90 T76 90 T88 90', c: 'red' },
  ],
  slovna_zasoba: [
    { d: 'M8 20 H44 V40 H8 Z M48 20 H92 V40 H48 Z' },
    { d: 'M22 44 H64 V64 H22 Z M68 44 H92 V64 H68 Z' },
    { d: 'M8 68 H38 V88 H8 Z', c: 'red' },
    { d: 'M44 78 H64 M54 68 V88', c: 'teal' },
  ],
  literatura: [
    { d: 'M80 10 C62 20 46 42 42 64 C58 58 74 38 80 10 Z' },
    { d: 'M42 64 L28 84 M56 38 L66 44', c: 'red' },
    { d: 'M18 72 H52 V90 H18 Z M23 72 V65 H47 V72' },
  ],
  slovne_druhy: [
    { d: 'M8 12 H56 L68 22 L56 32 H8 Z' },
    { d: 'M20 40 H68 L80 50 L68 60 H20 Z' },
    { d: 'M8 68 H56 L68 78 L56 88 H8 Z', c: 'red' },
    { d: circle(16, 22, 2) },
    { d: circle(28, 50, 2) },
    { d: circle(16, 78, 2), c: 'red' },
    { d: 'M26 22 H46 M38 50 H58 M26 78 H46', c: 'teal' },
  ],
  oko: [
    { d: 'M8 50 Q50 12 92 50 Q50 88 8 50 Z' },
    { d: circle(50, 50, 13) },
    { d: circle(50, 50, 4), c: 'red' },
  ],
};

export const ORDER: Record<string, string[]> = {
  aj: ["Prítomné časy", "Minulé a budúce časy", "Slovná zásoba", "Predložky a členy", "Modálne slovesá a podmienky", "Čítanie s porozumením"],
};

export const ENTRIES: Record<string, Record<string, Entry>> = {
  aj: {
  "Prítomné časy": {
    "hook": "Pravidelné je simple, práve teraz je continuous.",
    "summary": "Present simple vyjadruje zvyky a fakty (she plays). Present continuous opisuje dej, ktorý prebieha práve teraz (she is playing). V 3. osobe jednotného čísla pridávame v simple -s a otázku tvoríme pomocou do/does.",
    "rule": "Simple: every day, usually. Continuous: now, at the moment, Look!",
    "tips": [
      "Pri he/she/it: does + základný tvar (does she like?).",
      "Slovesá ako like, know, want sa v continuous zvyčajne nepoužívajú.",
      "Záporná veta: do not / does not + sloveso."
    ],
    "example": "He works every day, but today he is working at home.",
    "doodle": "skladba"
  },
  "Minulé a budúce časy": {
    "hook": "Minulosť tvoria -ed a nepravidelné tvary, budúcnosť will alebo going to.",
    "summary": "Pravidelné slovesá majú v minulosti príponu -ed, nepravidelné sa treba naučiť (go – went – gone). Will použijeme pri rozhodnutí v danej chvíli a predpovedi, going to pri plánoch a pri jasných znakoch.",
    "rule": "Záporná a opytovacia veta v minulosti: did + základný tvar.",
    "tips": [
      "Po did sloveso už nemení tvar: Did you go?",
      "Look at the clouds! = going to (vidíme dôkaz).",
      "Nepravidelné slovesá si opakuj po skupinách."
    ],
    "example": "I will help you. She is going to be a doctor.",
    "doodle": "skladba"
  },
  "Slovná zásoba": {
    "hook": "Slová si pamätaj v spojeniach, nie osamote.",
    "summary": "Najviac chýb vznikne pri slovesách make a do, pri podobných slovách a pri opakoch. Slovo sa dobre učí s celým spojením (make a decision, do homework) a s protikladom.",
    "rule": "make = vyrobiť, vytvoriť. do = činnosť, povinnosť.",
    "tips": [
      "Píš si slová do viet.",
      "Opakuj ich v krátkych dávkach každý deň.",
      "Učte sa protiklady: generous – mean."
    ],
    "example": "make a mistake, do the shopping, take a photo",
    "doodle": "literatura"
  },
  "Predložky a členy": {
    "hook": "In je veľké, on je deň, at je presný bod.",
    "summary": "In používame pri mesiacoch, rokoch a mestách. On pri dňoch a dátumoch, at pri presnom čase a mieste. Člen a/an patrí pred počítateľné podstatné meno v jednotnom čísle, the pred konkrétnu vec, ktorú už poznáme.",
    "rule": "in May, on Monday, at 8 o’clock.",
    "tips": [
      "An sa používa pred samohláskovým ZVUKOM (an hour, an apple).",
      "Jediné veci majú the: the Sun, the Moon.",
      "Pred názvami miest väčšinou člen nepoužívame."
    ],
    "example": "I live in Bratislava. The lesson is on Monday at 8.",
    "doodle": "priestor"
  },
  "Modálne slovesá a podmienky": {
    "hook": "Modálne sloveso sa po sebe vždy nechá základný tvar.",
    "summary": "Can, may a must vyjadrujú schopnosť, dovolenie a povinnosť. Must not znamená zákaz, don’t have to znamená, že to netreba. V podmienkových vetách po if v prítomnosti používame will, pre nereálnu situáciu would a po if tvar were.",
    "rule": "If + prítomný čas, will. If + minulý čas, would.",
    "tips": [
      "Po modálnom slovese nie je to ani -s ani to.",
      "Mustn’t = zákaz, don’t have to = nemusíš.",
      "If I were you… (aj pri I a he)."
    ],
    "example": "If it rains, we will stay at home. If I were rich, I would buy a boat.",
    "doodle": "pravopis"
  },
  "Čítanie s porozumením": {
    "hook": "Odpoveď je v texte. Nie v tvojej hlave.",
    "summary": "Najprv si prečítaj otázku, potom text. Nájdi vetu, ktorá odpoveď potvrdzuje, a nepoužívaj to, čo si len domýšľaš. Pozor na slová ako all, only, never, ktoré môžu zmeniť zmysel tvrdenia.",
    "rule": "Bez dôkazu v texte to nie je správna odpoveď.",
    "tips": [
      "Kľúčové slová z otázky si v texte vyhľadaj.",
      "Vylúč možnosti, ktoré text priamo vyvracia.",
      "Nehľadaj to, čo sa zdá pravdepodobné, ale čo je napísané."
    ],
    "example": "Text hovorí, že väčšina plastu pochádza zo súše, nie z lodí.",
    "doodle": "citanie"
  }
},
};

// Témy v poradí zápisníka: najprv tie so záznamom, ostatné nakoniec.
export function orderTopics(subject: string, names: string[]): string[] {
  const order = ORDER[subject] ?? [];
  const known = order.filter((n) => names.includes(n));
  const rest = names.filter((n) => !order.includes(n)).sort((a, b) => a.localeCompare(b, 'sk'));
  return [...known, ...rest];
}
