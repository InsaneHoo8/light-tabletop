import fs from 'node:fs';

const p = 'game-lab/arena/cards.js';
let src = fs.readFileSync(p, 'utf8');

function shift(id, delta) {
  const at = src.indexOf(`id: '${id}'`);
  if (at < 0) throw new Error('нет персонажа ' + id);
  const end = src.indexOf('abilities: [', at);
  let block = src.slice(at, end);
  const m = block.match(/hp: (\d+)/);
  if (!m) throw new Error('нет здоровья у ' + id);
  const before = Number(m[1]);
  const after = before + delta;
  block = block.replace(/hp: \d+/, 'hp: ' + after);
  src = src.slice(0, at) + block + src.slice(end);
  console.log(id + ': здоровье ' + before + ' -> ' + after);
}

shift('zhulien', -1);
shift('heil', -1);

fs.writeFileSync(p, src, 'utf8');
