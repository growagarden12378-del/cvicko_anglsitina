import { CEFR } from './cefr';
import { load, save } from './progress';

export type Placement = { q: string; o: string[]; c: number };

// 25 úloh, 5 na úroveň (A1, A2, B1, B2, C1). Test je adaptívny: končí, keď žiak v bloku neuspeje.
export const BLOCK = 5;
export const PASS = 3;
export const PLACEMENT: Placement[] = [
  // A1
  { q: 'She ___ from Slovakia.', o: ['am', 'is', 'are', 'be'], c: 1 },
  { q: 'I ___ two brothers.', o: ['have', 'has', 'am', 'is'], c: 0 },
  { q: 'There ___ a book on the table.', o: ['is', 'are', 'am', 'be'], c: 0 },
  { q: '___ you like pizza?', o: ['Do', 'Does', 'Is', 'Are'], c: 0 },
  { q: 'Čo znamená „breakfast“?', o: ['raňajky', 'obed', 'večera', 'desiata'], c: 0 },
  // A2
  { q: 'Yesterday I ___ my grandma.', o: ['visit', 'visited', 'visiting', 'visits'], c: 1 },
  { q: 'She is ___ than her sister.', o: ['tall', 'taller', 'tallest', 'more tall'], c: 1 },
  { q: 'We ___ TV when the phone rang.', o: ['watched', 'were watching', 'watch', 'are watching'], c: 1 },
  { q: 'I am going to ___ a new phone next month.', o: ['buy', 'buys', 'bought', 'buying'], c: 0 },
  { q: 'How ___ water do you drink a day?', o: ['many', 'much', 'lot', 'few'], c: 1 },
  // B1
  { q: 'I have been learning English ___ three years.', o: ['since', 'for', 'from', 'during'], c: 1 },
  { q: 'This is the house ___ I grew up.', o: ['who', 'which', 'where', 'what'], c: 2 },
  { q: 'The window ___ by the boy yesterday.', o: ['broke', 'was broken', 'is broken', 'has broke'], c: 1 },
  { q: 'He said that he ___ tired.', o: ['is', 'was', 'be', 'were'], c: 1 },
  { q: 'I am not used to ___ up early.', o: ['get', 'getting', 'got', 'gets'], c: 1 },
  // B2
  { q: 'By next year, I ___ my studies.', o: ['will finish', 'will have finished', 'finish', 'am finishing'], c: 1 },
  { q: 'I wish I ___ more time yesterday.', o: ['have', 'had', 'had had', 'would have'], c: 2 },
  { q: 'Despite ___ tired, she went to the gym.', o: ['be', 'being', 'was', 'she was'], c: 1 },
  { q: 'He is the man ___ car was stolen.', o: ['who', 'whom', 'whose', 'which'], c: 2 },
  { q: 'If I had studied harder, I ___ the exam.', o: ['would pass', 'would have passed', 'will pass', 'passed'], c: 1 },
  // C1
  { q: 'Hardly ___ the house when it started to rain.', o: ['had we left', 'we had left', 'did we leave', 'we left'], c: 0 },
  { q: 'She ___ have left already; her coat is gone.', o: ['must', 'should', 'would', 'can'], c: 0 },
  { q: 'Čo znamená „reluctant“?', o: ['neochotný', 'ochotný', 'unavený', 'nahnevaný'], c: 0 },
  { q: 'No sooner had I arrived ___ the phone rang.', o: ['than', 'when', 'that', 'then'], c: 0 },
  { q: 'The report, ___ was published last week, caused a debate.', o: ['who', 'which', 'what', 'whose'], c: 1 },
];

// Počet po sebe splnených blokov = úroveň (aspoň A1)
export function levelFromBlocks(passed: number) {
  return Math.min(Math.max(passed, 1), CEFR.length);
}

// Žiak začína na XP, ktoré zodpovedajú jeho úrovni (nikdy sa mu XP neznížia)
export function applyPlacement(level: number) {
  try {
    const p = load();
    const floor = CEFR[level - 1].from;
    if (p.xp < floor) save({ ...p, xp: floor });
  } catch {}
}

const KEY = 'cvicko-level-v2';
export function readLevel(): { level: number } | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    return v && v.level >= 1 && v.level <= CEFR.length ? v : null;
  } catch {
    return null;
  }
}
export function saveLevel(level: number) {
  try { localStorage.setItem(KEY, JSON.stringify({ level, at: Date.now() })); } catch {}
}
export function clearLevel() {
  try { localStorage.removeItem(KEY); } catch {}
}
