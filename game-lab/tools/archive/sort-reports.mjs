/* Раскладывает отчёты по папкам патчей: и markdown-исходники, и документы Word. */

import fs from 'node:fs';
import path from 'node:path';

const MD_DIR = 'game-lab/docs/Симуляция игр ботяр';
const DOCX_DIR = 'C:\\Users\\InsaneHoo8\\Desktop\\Лайтовая настолка\\Симуляция игр ботяр';

function folderFor(baseName) {
  const m = baseName.match(/0\.0\.(\d)/);
  if (m) return 'Патч 0.0.' + m[1];
  return 'До патчей';
}

const moved = [];
const missing = [];

function ensure(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/* markdown */
for (const f of fs.readdirSync(MD_DIR).filter((x) => x.endsWith('.md'))) {
  const base = f.replace(/\.md$/, '');
  const folder = folderFor(base);
  ensure(path.join(MD_DIR, folder));
  fs.renameSync(path.join(MD_DIR, f), path.join(MD_DIR, folder, f));
  moved.push(folder + ' / ' + base);
}

/* документы Word */
for (const f of fs.readdirSync(DOCX_DIR).filter((x) => x.endsWith('.docx'))) {
  const base = f.replace(/\.docx$/, '');
  const folder = folderFor(base);
  ensure(path.join(DOCX_DIR, folder));
  fs.renameSync(path.join(DOCX_DIR, f), path.join(DOCX_DIR, folder, f));
}

/* отчёт без пары в markdown */
for (const f of fs.readdirSync(DOCX_DIR).filter((x) => x.endsWith('.docx'))) {
  const base = f.replace(/\.docx$/, '');
  const mdCheck = path.join(MD_DIR, folderFor(base), base + '.md');
  if (!fs.existsSync(mdCheck)) missing.push(base);
}

console.log('разложено отчётов: ' + moved.length);
if (missing.length) {
  console.log('документы без markdown-исходника: ' + missing.length);
  for (const m of missing) console.log('  ' + m);
}
