import fs from 'node:fs';

const hp = Number(process.argv[2]);
const dmg = Number(process.argv[3]);
if (!hp || !dmg) {
  console.log('нужно: hp dmg');
  process.exit(1);
}

const p = 'game-lab/arena/cards.js';
let src = fs.readFileSync(p, 'utf8');
const at = src.indexOf("id: 'mirai'");
if (at < 0) throw new Error('нет Мирай');
const end = src.indexOf('abilities: [', at);
let block = src.slice(at, end);
const oldHp = block.match(/hp: (\d+)/)[1];
const oldDmg = block.match(/dmg: (\d+)/)[1];
block = block.replace(/hp: \d+/, 'hp: ' + hp).replace(/dmg: \d+/, 'dmg: ' + dmg);
src = src.slice(0, at) + block + src.slice(end);
fs.writeFileSync(p, src, 'utf8');
console.log('Мирай: ' + oldHp + '/' + oldDmg + ' -> ' + hp + '/' + dmg);
