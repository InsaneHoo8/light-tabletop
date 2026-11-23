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

rep("{ id: 'psihkoz', name: 'Массовый психоз', cost: 5,", "{ id: 'psihkoz', name: 'Массовый психоз', cost: 4,", 'психоз за четыре');

const gAt = c.indexOf("id: 'grog'");
const gEnd = c.indexOf('abilities: [', gAt);
let gBlock = c.slice(gAt, gEnd);
const oldHp = gBlock.match(/hp: (\d+)/)[1];
gBlock = gBlock.replace(/hp: \d+/, 'hp: 24');
c = c.slice(0, gAt) + gBlock + c.slice(gEnd);
console.log('ok: Грог ' + oldHp + ' -> 24');
n++;

fs.writeFileSync(cp, c, 'utf8');
console.log('изменений: ' + n);
