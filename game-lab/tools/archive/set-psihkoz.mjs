import fs from 'node:fs';

const cost = Number(process.argv[2]);
if (!cost) {
  console.log('нужно: стоимость');
  process.exit(1);
}

const cp = 'game-lab/arena/cards.js';
let c = fs.readFileSync(cp, 'utf8').replace(/\r\n/g, '\n');
const old = "{ id: 'psihkoz', name: 'Массовый психоз', cost: 4,";
if (!c.includes(old)) throw new Error('психоз не найден или уже другая цена');
c = c.replace(old, "{ id: 'psihkoz', name: 'Массовый психоз', cost: " + cost + ',');
fs.writeFileSync(cp, c, 'utf8');
console.log('психоз: цена ' + cost);
