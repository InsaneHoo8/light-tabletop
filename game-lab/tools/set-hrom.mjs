import fs from 'node:fs';

const hp = Number(process.argv[2]);
if (!hp) {
  console.log('нужно число здоровья');
  process.exit(1);
}

const p = 'game-lab/arena/cards.js';
let src = fs.readFileSync(p, 'utf8');
const at = src.indexOf("id: 'hrom'");
if (at < 0) throw new Error('нет Хрома');
const end = src.indexOf('abilities: [', at);
let block = src.slice(at, end);
const before = block.match(/hp: (\d+)/)[1];
block = block.replace(/hp: \d+/, 'hp: ' + hp);
src = src.slice(0, at) + block + src.slice(end);
fs.writeFileSync(p, src, 'utf8');
console.log('Хром: здоровье ' + before + ' -> ' + hp);
