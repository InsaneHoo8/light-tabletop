/* Ставит всем одинаковые характеристики или возвращает исходные. */

import fs from 'node:fs';

const path = 'game-lab/arena/cards.js';
const backup = 'game-lab/arena/cards.js.stats-before';

const mode = process.argv[2];

if (mode === 'equalize') {
  fs.copyFileSync(path, backup);
  let src = fs.readFileSync(path, 'utf8');
  const ids = [];
  const re = /id: '([a-z0-9_]+)', name: '[^']+', full:/g;
  let m;
  while ((m = re.exec(src))) ids.push(m[1]);
  for (const id of ids) {
    const at = src.indexOf(`id: '${id}'`);
    const blockEnd = src.indexOf('abilities: [', at);
    let block = src.slice(at, blockEnd);
    block = block.replace(/\bhp: \d+/, 'hp: 26').replace(/\bdmg: \d+/, 'dmg: 2');
    src = src.slice(0, at) + block + src.slice(blockEnd);
  }
  fs.writeFileSync(path, src, 'utf8');
  console.log('всем выставлено 26 здоровья и 2 урона, персонажей: ' + ids.length);
} else if (mode === 'restore') {
  if (!fs.existsSync(backup)) throw new Error('нет сохранённых значений');
  fs.copyFileSync(backup, path);
  fs.unlinkSync(backup);
  console.log('исходные характеристики возвращены');
} else {
  console.log('режим: equalize или restore');
}
