import fs from 'node:fs';

/* Чистка инструментов: убрать неиспользуемое, сделать git устойчивее */

/* 1. card-edit: убрать мёртвый код */
const cp = 'game-lab/tools/card-edit.mjs';
let c = fs.readFileSync(cp, 'utf8').replace(/\r\n/g, '\n');

c = c.replace('\nconst GIT = null;', '');

const sbStart = c.indexOf('function sectionBounds(marker) {');
if (sbStart >= 0) {
  const sbEnd = c.indexOf('}\n', sbStart) + 2;
  c = c.slice(0, sbStart) + c.slice(sbEnd);
}

fs.writeFileSync(cp, c, 'utf8');
console.log('card-edit: мёртвый код убран');

/* 2. publish: искать git в PATH, а не только по одному пути */
const pp = 'game-lab/tools/publish.mjs';
let p = fs.readFileSync(pp, 'utf8').replace(/\r\n/g, '\n');

const oldGit = "const GIT = 'C:\\\\Program Files\\\\Git\\\\cmd\\\\git.exe';";
const newGit = `import { existsSync } from 'node:fs';

const GIT = [
  'C:\\\\Program Files\\\\Git\\\\cmd\\\\git.exe',
  'C:\\\\Program Files (x86)\\\\Git\\\\cmd\\\\git.exe'
].find(existsSync) || 'git';`;

if (!p.includes(oldGit)) {
  console.log('publish: путь к git не найден, оставлено как есть');
} else {
  p = p.replace(oldGit, newGit);
  fs.writeFileSync(pp, p, 'utf8');
  console.log('publish: git ищется в двух местах, иначе из PATH');
}

/* 3. publish: проверка документов перед коммитом */
let p2 = fs.readFileSync(pp, 'utf8').replace(/\r\n/g, '\n');
if (!p2.includes('docs-consistency')) {
  const anchor = `/* 3. обновляем историю версий */`;
  const block = `/* сверка документов с данными */
console.log('--- сверка документов');
try {
  execFileSync('node', ['game-lab/tools/docs-consistency.mjs'], { stdio: 'inherit' });
} catch (e) {
  console.log('публикация остановлена: документы разошлись с данными');
  process.exit(1);
}

/* 3. обновляем историю версий */`;
  if (p2.includes(anchor)) {
    p2 = p2.replace(anchor, block);
    fs.writeFileSync(pp, p2, 'utf8');
    console.log('publish: добавлена сверка документов');
  } else {
    console.log('publish: не найден раздел для вставки сверки документов');
  }
}
