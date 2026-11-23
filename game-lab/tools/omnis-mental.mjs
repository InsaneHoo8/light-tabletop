import fs from 'node:fs';

const p = 'game-lab/arena/cards.js';
let c = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

const at = c.indexOf("id: 'omnis'");
if (at < 0) throw new Error('нет Омниса');
const end = c.indexOf('abilities: [', at);
let block = c.slice(at, end);
const m = block.match(/mental: (\d+)/);
if (!m) throw new Error('нет менталки');
const old = Number(m[1]);
block = block.replace(/mental: \d+/, 'mental: 8');
c = c.slice(0, at) + block + c.slice(end);
fs.writeFileSync(p, c, 'utf8');
console.log('Омнис: менталка ' + old + ' -> 8');
