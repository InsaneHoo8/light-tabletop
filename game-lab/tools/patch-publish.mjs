import fs from 'node:fs';

const p = 'game-lab/tools/publish.mjs';
let s = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

const old = `/* 2. обновляем историю версий */`;
const neu = `/* 2. сверка баланса с эталоном */
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

/* 3. обновляем историю версий */`;

if (!s.includes(old)) throw new Error('не найден раздел истории версий');
s = s.replace(old, neu);

/* перенумеровать оставшиеся шаги */
s = s.replace('/* 3. коммит */', '/* 4. коммит */');
s = s.replace('/* 4. тег версии */', '/* 5. тег версии */');
s = s.replace('/* 5. отправка */', '/* 6. отправка */');

fs.writeFileSync(p, s, 'utf8');
console.log('publish: добавлена сверка баланса');
