// Halloween obchod: za cukríky 🍬 (zbierajú sa za správne odpovede) sa kupujú ozdoby a bonus.
export type ItemKind = 'badge' | 'fx' | 'boost';
export type Item = { id: string; kind: ItemKind; emoji: string; name: string; desc: string; price: number };

export const ITEMS: Item[] = [
  { id: 'bat', kind: 'badge', emoji: '🦇', name: 'Netopierik', desc: 'Malý odznak pri tvojom mene.', price: 30 },
  { id: 'ghost', kind: 'badge', emoji: '👻', name: 'Strašidielko', desc: 'Odznak pri mene v rebríčku.', price: 50 },
  { id: 'spider', kind: 'badge', emoji: '🕷️', name: 'Pavúčik', desc: 'Pre tých, čo číhajú na správnu odpoveď.', price: 80 },
  { id: 'witch', kind: 'badge', emoji: '🧙', name: 'Čarodejník', desc: 'Odznak pre skúsených.', price: 120 },
  { id: 'crown', kind: 'badge', emoji: '👑', name: 'Kráľ cukríkov', desc: 'Najvzácnejší odznak.', price: 400 },
  { id: 'webs', kind: 'fx', emoji: '🕸️', name: 'Pavučiny', desc: 'Pavučiny v rohoch stránky.', price: 80 },
  { id: 'candyrain', kind: 'fx', emoji: '🍭', name: 'Dážď cukríkov', desc: 'Cez stránku padajú sladkosti.', price: 150 },
  { id: 'magnet', kind: 'boost', emoji: '🧲', name: 'Cukríkový magnet', desc: 'Za každú správnu odpoveď dostaneš o polovicu viac cukríkov.', price: 100 },
];

export const itemById = (id: string): Item | undefined => ITEMS.find((i) => i.id === id);
export const MAGNET = 'magnet';
