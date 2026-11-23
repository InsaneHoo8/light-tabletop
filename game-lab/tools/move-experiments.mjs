/* Переносит уже созданные эксперименты в папку «Эксперименты». */

import fs from 'node:fs';
import path from 'node:path';

const MD_ROOT = 'game-lab/docs/Симуляция игр ботяр';
const DOCX_ROOT = 'C:\\Users\\InsaneHoo8\\Desktop\\Лайтовая настолка\\Симуляция игр ботяр';
const TARGET = 'Эксперименты';

fs.mkdirSync(path.join(MD_ROOT, TARGET), { recursive: true });
fs.mkdirSync(path.join(DOCX_ROOT, TARGET), { recursive: true });

let moved = 0;

for (const dir of fs.readdirSync(MD_ROOT, { withFileTypes: true })) {
  if (!dir.isDirectory() || dir.name === TARGET) continue;
  const full = path.join(MD_ROOT, dir.name);
  for (const f of fs.readdirSync(full)) {
    if (!f.startsWith('Эксперимент')) continue;
    fs.renameSync(path.join(full, f), path.join(MD_ROOT, TARGET, f));

    if (f.endsWith('.md')) {
      const docxName = f.replace(/\.md$/, '.docx');
      const from = path.join(DOCX_ROOT, dir.name, docxName);
      if (fs.existsSync(from)) {
        fs.renameSync(from, path.join(DOCX_ROOT, TARGET, docxName));
      }
      moved++;
    }
  }
}

console.log('перенесено отчётов: ' + moved);
