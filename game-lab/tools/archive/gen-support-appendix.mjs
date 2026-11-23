import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const D = require('../arena/game-data.js');

const targets = [
  { id: 'borya', file: 'game-lab/rules/sup-borya.json', extra: ['shafll', 'opohmel', 'butylka'] },
  { id: 'lyusya', file: 'game-lab/rules/sup-lyusya.json', extra: ['layk', 'sniper', 'hayp'] },
  { id: 'omnis', file: 'game-lab/rules/sup-omnis.json', extra: ['backup', 'analyze', 'overload'] }
];

for (const t of targets) {
  const c = D.charById(t.id);
  const blocks = [
    { kind: 'h', text: 'Добавленные способности' },
    { kind: 'p', text: 'Энергия увеличена до пяти, набор расширен до пяти карт.' }
  ];
  for (const id of t.extra) {
    const a = c.abilities.find((x) => x.id === id);
    if (!a) throw new Error('нет способности ' + id);
    blocks.push({ kind: 'b', bold: a.name + ' — ' + a.cost + ' энергии.', text: ' ' + a.desc + (a.neighborsOnly ? ' Только сосед.' : '') });
  }
  fs.writeFileSync(t.file, JSON.stringify(blocks, null, 2), 'utf8');
  console.log(t.file + ': ' + blocks.length + ' блоков');
}
