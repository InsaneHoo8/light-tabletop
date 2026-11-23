/* Собирает CHANGELOG.md из реестра патчей. */

import fs from 'node:fs';

const reg = JSON.parse(fs.readFileSync('game-lab/patches.json', 'utf8'));

const lines = [];
lines.push('# История версий');
lines.push('');
lines.push('Собрано из `game-lab/patches.json`. Текущая версия — ' + reg.current + '.');
lines.push('');

const patches = reg.patches.slice().reverse();

for (const p of patches) {
  lines.push('## ' + p.version + ' — ' + p.title);
  lines.push('');
  lines.push('Дата: ' + p.date + '.');
  lines.push('');
  if (p.changes && p.changes.length) {
    for (const c of p.changes) lines.push('- ' + c);
    lines.push('');
  }
}

fs.writeFileSync('CHANGELOG.md', lines.join('\n'), 'utf8');
console.log('CHANGELOG.md обновлён: версий ' + patches.length + ', текущая ' + reg.current);
