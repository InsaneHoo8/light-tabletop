import fs from 'node:fs';

const cp = 'game-lab/arena/cards.js';
let c = fs.readFileSync(cp, 'utf8').replace(/\r\n/g, '\n');

let n = 0;
function rep(old, neu, label) {
  if (!c.includes(old)) throw new Error('НЕ НАЙДЕНО: ' + label);
  c = c.replace(old, neu);
  n++;
  console.log('ok: ' + label);
}

rep("desc: 'пять урона цели и два себе', ops: [{ t: 'dmg', who: 'target', n: 5 }, { t: 'dmg', who: 'self', n: 2, pierce: true }]",
  "desc: 'шесть урона цели и два себе', ops: [{ t: 'dmg', who: 'target', n: 6 }, { t: 'dmg', who: 'self', n: 2, pierce: true }]",
  'Вспышка Бездны шесть');

rep("desc: 'три урона и цель сбрасывает две способности', ops: [{ t: 'dmg', who: 'target', n: 3 }, { t: 'discardAbility', who: 'target', n: 2 }]",
  "desc: 'четыре урона и цель сбрасывает две способности', ops: [{ t: 'dmg', who: 'target', n: 4 }, { t: 'discardAbility', who: 'target', n: 2 }]",
  'Порча четыре');

fs.writeFileSync(cp, c, 'utf8');
console.log('исправлено карт: ' + n);
