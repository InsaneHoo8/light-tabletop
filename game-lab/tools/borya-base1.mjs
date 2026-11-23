import fs from 'node:fs';

/* базовый урон Бори 2 -> 1 */
const cp = 'game-lab/arena/cards.js';
let c = fs.readFileSync(cp, 'utf8').replace(/\r\n/g, '\n');

const at = c.indexOf("id: 'borya'");
if (at < 0) throw new Error('нет Бори');
const end = c.indexOf('abilities: [', at);
let block = c.slice(at, end);
const oldDmg = block.match(/dmg: (\d+)/)[1];
block = block.replace(/dmg: \d+/, 'dmg: 1');
block = block.replace(/passive: '[^']*'/,
  "passive: 'Бьёт с руки на одну единицу слабее. Когда не хватает двух энергии, прибавляет единицу к урону обычной атаки. Когда не хватает четырёх — прибавляет ещё одну, но и сам получает на единицу больше урона от любых источников.'");
c = c.slice(0, at) + block + c.slice(end);
fs.writeFileSync(cp, c, 'utf8');
console.log('Боря: урон ' + oldDmg + ' -> 1, текст пассивки');

/* штраф по получаемому урону: плюс два -> плюс один */
const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');
const oldD = "if (missBD >= 4) dmg = dmg + 2;";
const newD = "if (missBD >= 4) dmg = dmg + 1;";
if (!e.includes(oldD)) throw new Error('не найден штраф Бори');
e = e.replace(oldD, newD);
fs.writeFileSync(ep, e, 'utf8');
console.log('движок: штраф Бори плюс один');
