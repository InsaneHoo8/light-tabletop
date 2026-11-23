import fs from 'node:fs';

const path = 'game-lab/arena/game-data.js';
let src = fs.readFileSync(path, 'utf8');

function replaceEntry(id, newLine) {
  const at = src.indexOf(`id: '${id}'`);
  if (at < 0) throw new Error('нет способности ' + id);
  const start = src.lastIndexOf('{', at);
  let depth = 0;
  let end = start;
  for (let i = start; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  src = src.slice(0, start) + newLine + src.slice(end);
  console.log(id + ': заменена');
}

replaceEntry(
  'parazit',
  "{ id: 'parazit', name: 'Цифровой паразит', cost: 2, target: true, secondTarget: true, puppetQuestion: 'Кем управлять?', secondQuestion: 'Кого он ударит?', desc: 'выбранный игрок бьёт того, кого укажете', effects: [{ puppet: true }] }"
);

replaceEntry(
  'vzlom',
  "{ id: 'vzlom', name: 'Взлом', cost: 2, target: true, desc: 'крадёт у цели один артефакт, одно здоровье и две менталки', effects: [{ stealArtifact: 1, target: 'choose' }, { damage: 1, target: 'choose' }, { heal: 1, target: 'self' }, { stealResource: 'mental', amount: 2, target: 'choose' }] }"
);

replaceEntry(
  'lyubov',
  "{ id: 'lyubov', name: 'Народная любовь', cost: 3, desc: 'два здоровья и две менталки себе, все остальные получают один урон', effects: [{ heal: 2, target: 'self' }, { gain: { mental: 2 }, target: 'self' }, { damage: 1, target: 'allOthers' }] }"
);

fs.writeFileSync(path, src, 'utf8');
