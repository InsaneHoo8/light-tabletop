import fs from 'node:fs';

const path = 'game-lab/arena/cards.js';
let src = fs.readFileSync(path, 'utf8');

const changes = {
  heil: { hp: 28 },
  borya: { hp: 27 },
  zhulien: { hp: 27 },
  etkora: { hp: 27 },
  lyusya: { hp: 27 }
};

for (const [id, patch] of Object.entries(changes)) {
  const at = src.indexOf(`id: '${id}'`);
  if (at < 0) throw new Error('нет персонажа ' + id);
  const blockEnd = src.indexOf('abilities: [', at);
  if (blockEnd < 0) throw new Error('нет блока способностей у ' + id);
  let block = src.slice(at, blockEnd);
  for (const [key, value] of Object.entries(patch)) {
    const re = new RegExp('\\b' + key + ': \\d+');
    if (!re.test(block)) throw new Error('нет поля ' + key + ' у ' + id);
    block = block.replace(re, key + ': ' + value);
  }
  src = src.slice(0, at) + block + src.slice(blockEnd);
  console.log(id + ': ' + JSON.stringify(patch));
}

fs.writeFileSync(path, src, 'utf8');
