import fs from 'node:fs';

const p = 'game-lab/arena/cards.js';
let c = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

const old = "{ id: 'psihkoz', name: 'Массовый психоз', cost: 5,";
const neu = "{ id: 'psihkoz', name: 'Массовый психоз', cost: 4,";

if (!c.includes(old)) {
  console.log('уже не пятая цена');
} else {
  c = c.replace(old, neu);
  fs.writeFileSync(p, c, 'utf8');
  console.log('психоз возвращён на четыре');
}
