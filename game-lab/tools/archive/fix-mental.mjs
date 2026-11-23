import fs from 'node:fs';

const path = 'game-lab/arena/game-data.js';
let src = fs.readFileSync(path, 'utf8');

const mental = {
  varvar: 4, vor: 6, mag: 4, borya: 4,
  hrom: 4, mirai: 4, glyuk: 4,
  omnis: 4, etkora: 4, heil: 4,
  grigori: 4, lyusya: 4
};

for (const [id, value] of Object.entries(mental)) {
  const at = src.indexOf(`id: '${id}'`);
  if (at < 0) throw new Error('нет персонажа ' + id);
  const mAt = src.indexOf('mental: ', at);
  const colon = mAt + 'mental: '.length;
  const end = src.indexOf(',', colon);
  const old = Number(src.slice(colon, end).trim());
  src = src.slice(0, colon) + String(value) + src.slice(end);
  console.log(id + ': менталка ' + old + ' -> ' + value);
}
fs.writeFileSync(path, src, 'utf8');
