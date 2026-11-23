/* Наводит порядок: старое прототипное хозяйство уезжает в архив,
   рабочие шаблоны остаются на месте. */

import fs from 'node:fs';
import path from 'node:path';

function moveIntoArchive(sourceDir, keep, archiveDir) {
  fs.mkdirSync(archiveDir, { recursive: true });
  let moved = 0;
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (keep.includes(entry.name)) continue;
    fs.renameSync(path.join(sourceDir, entry.name), path.join(archiveDir, entry.name));
    moved++;
  }
  return moved;
}

/* 1. game-lab/rules: оставить только шаблон Word */
const rulesMoved = moveIntoArchive('game-lab/rules', ['template.docx'], 'game-lab/rules/archive');
console.log('rules: в архив ' + rulesMoved + ', остался шаблон');

/* 2. старый прогонщик sim.mjs — в архив инструментов */
fs.mkdirSync('game-lab/tools/archive', { recursive: true });
for (const f of ['sim.mjs']) {
  const from = path.join('game-lab/arena/tools', f);
  if (fs.existsSync(from)) {
    fs.renameSync(from, path.join('game-lab/tools/archive', f));
    console.log('arena/tools: ' + f + ' в архив');
  }
}

/* 3. демо «Тихая гавань» — другой прототип, в общий архив */
fs.mkdirSync('game-lab/archive', { recursive: true });
if (fs.existsSync('game-lab/demo')) {
  fs.renameSync('game-lab/demo', path.join('game-lab/archive', 'demo-tihaya-gavan'));
  console.log('demo перенесён в game-lab/archive/demo-tihaya-gavan');
}
