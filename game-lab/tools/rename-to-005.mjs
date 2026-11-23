/* Переименовывает отчёты патча 0.0.5: и файл, и текст внутри. */

import fs from 'node:fs';
import path from 'node:path';

const MD_ROOT = 'game-lab/docs/Симуляция игр ботяр';
const DOCX_ROOT = 'C:\\Users\\InsaneHoo8\\Desktop\\Лайтовая настолка\\Симуляция игр ботяр';
const DIR = 'Патч 0.0.5';

const mdDir = path.join(MD_ROOT, DIR);
const docxDir = path.join(DOCX_ROOT, DIR);

const renamed = [];

for (const f of fs.readdirSync(mdDir).filter((x) => x.endsWith('.md'))) {
  const base = f.replace(/\.md$/, '');
  if (!base.includes('0.0.4')) continue;

  /* содержимое: номер патча и дата */
  let text = fs.readFileSync(path.join(mdDir, f), 'utf8');
  text = text.replace(/0\.0\.4/g, '0.0.5').replace(/от 2026-11-14/g, 'от 2026-11-22');
  fs.writeFileSync(path.join(mdDir, f), text, 'utf8');

  const newBase = base.replace(/0\.0\.4/g, '0.0.5');
  fs.renameSync(path.join(mdDir, f), path.join(mdDir, newBase + '.md'));

  const oldDocx = path.join(docxDir, base + '.docx');
  const newDocx = path.join(docxDir, newBase + '.docx');
  if (fs.existsSync(oldDocx)) fs.renameSync(oldDocx, newDocx);

  renamed.push(newBase);
}

console.log('переименовано: ' + renamed.length);
for (const r of renamed) console.log('  ' + r);
