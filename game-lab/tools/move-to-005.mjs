/* Создаёт папку патча 0.0.5 и переносит туда сегодняшние отчёты. */

import fs from 'node:fs';
import path from 'node:path';

const MD_ROOT = 'game-lab/docs/Симуляция игр ботяр';
const DOCX_ROOT = 'C:\\Users\\InsaneHoo8\\Desktop\\Лайтовая настолка\\Симуляция игр ботяр';

const FROM = path.join('Патч 0.0.4');
const TO = path.join('Патч 0.0.5');
const MARK = '22-11-2026';

fs.mkdirSync(path.join(MD_ROOT, TO), { recursive: true });
fs.mkdirSync(path.join(DOCX_ROOT, TO), { recursive: true });

let movedMd = 0;
let movedDocx = 0;

for (const f of fs.readdirSync(path.join(MD_ROOT, FROM))) {
  if (!f.includes(MARK) || !f.endsWith('.md')) continue;
  fs.renameSync(path.join(MD_ROOT, FROM, f), path.join(MD_ROOT, TO, f));
  movedMd++;
}

for (const f of fs.readdirSync(path.join(DOCX_ROOT, FROM))) {
  if (!f.includes(MARK) || !f.endsWith('.docx')) continue;
  fs.renameSync(path.join(DOCX_ROOT, FROM, f), path.join(DOCX_ROOT, TO, f));
  movedDocx++;
}

console.log('перенесено исходников: ' + movedMd + ', документов: ' + movedDocx);
