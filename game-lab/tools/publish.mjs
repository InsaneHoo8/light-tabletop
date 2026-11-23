/* Публикация: проверка движка, коммит, тег и отправка на GitHub.
   Запуск: node game-lab/tools/publish.mjs "сообщение коммита" [версия] */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

import { existsSync } from 'node:fs';

const GIT = [
  'C:\\Program Files\\Git\\cmd\\git.exe',
  'C:\\Program Files (x86)\\Git\\cmd\\git.exe'
].find(existsSync) || 'git';

function run(args, quiet) {
  const res = execFileSync(GIT, args, { encoding: 'utf8', stdio: quiet ? 'pipe' : 'inherit' });
  return res;
}

const message = process.argv[2];
const version = process.argv[3];

if (!message) {
  console.log('нужно: node game-lab/tools/publish.mjs "сообщение коммита" [версия]');
  process.exit(1);
}

/* 1. проверка движка */
console.log('--- проверка движка');
execFileSync('node', ['game-lab/arena/tools/self-check.mjs'], { stdio: 'inherit' });

/* 2. сверка баланса с эталоном */
console.log('--- сверка баланса');
let balanceOk = true;
try {
  execFileSync('node', ['game-lab/tools/balance-check.mjs'], { stdio: 'inherit' });
} catch (e) {
  balanceOk = false;
  console.log('баланс отличается от эталона');
}

if (!balanceOk) {
  console.log('публикация остановлена: сначала обновите эталон или проверьте правку');
  process.exit(1);
}

/* сверка документов с данными */
console.log('--- сверка документов');
try {
  execFileSync('node', ['game-lab/tools/docs-consistency.mjs'], { stdio: 'inherit' });
} catch (e) {
  console.log('публикация остановлена: документы разошлись с данными');
  process.exit(1);
}

/* 3. обновляем историю версий */
console.log('--- история версий');
execFileSync('node', ['game-lab/tools/make-changelog.mjs'], { stdio: 'inherit' });

/* 4. коммит */
console.log('--- коммит');
run(['add', '-A']);
const status = run(['status', '--porcelain'], true).trim();
if (!status) {
  console.log('изменений нет, коммитить нечего');
} else {
  run(['commit', '-m', message]);
}

/* 5. тег версии */
if (version) {
  console.log('--- тег v' + version);
  try {
    run(['tag', '-a', 'v' + version, '-m', 'Патч ' + version]);
  } catch (e) {
    console.log('тег уже существует');
  }
}

/* 6. отправка */
console.log('--- отправка на GitHub');
try {
  run(['push', 'origin', 'main']);
  if (version) run(['push', 'origin', 'v' + version]);
  console.log('готово');
} catch (e) {
  console.log('отправка не удалась: проверьте вход в GitHub');
  process.exit(1);
}
