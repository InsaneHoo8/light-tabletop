import fs from 'node:fs';

const p = 'game-lab/arena/cards.js';
let src = fs.readFileSync(p, 'utf8');

const at = src.indexOf("id: 'grog'");
if (at < 0) throw new Error('нет Грога');
const end = src.indexOf('abilities: [', at);
let block = src.slice(at, end);
const before = block.match(/dmg: (\d+)/)[1];
block = block.replace(/dmg: \d+/, 'dmg: 2');
src = src.slice(0, at) + block + src.slice(end);
fs.writeFileSync(p, src, 'utf8');
console.log('Грог: урон ' + before + ' -> 2');
