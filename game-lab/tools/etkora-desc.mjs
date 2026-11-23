import fs from 'node:fs';

const cp = 'game-lab/arena/cards.js';
let c = fs.readFileSync(cp, 'utf8').replace(/\r\n/g, '\n');

const at = c.indexOf("id: 'etkora'");
if (at < 0) throw new Error('нет Эт’Коры');
const end = c.indexOf('abilities: [', at);
let block = c.slice(at, end);

const oldPassive = block.match(/passive: '[^']*'/);
if (!oldPassive) throw new Error('нет пассивки');

const neu = "passive: 'Держит до шести ворованных способностей сверх лимита руки. Применённая сворованная способность уходит в сброс своему прежнему владельцу, а не Эт’Коре.'";
block = block.replace(/passive: '[^']*'/, neu);
c = c.slice(0, at) + block + c.slice(end);

fs.writeFileSync(cp, c, 'utf8');
console.log('пассивка Эт’Коры обновлена');
