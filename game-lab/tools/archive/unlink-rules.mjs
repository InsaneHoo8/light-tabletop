import fs from 'node:fs';

const p = 'game-lab/tools/gen-prompt-docs.mjs';
let src = fs.readFileSync(p, 'utf8');

const start = src.indexOf('/* 3. правила */');
const marker = "fs.writeFileSync(path.join(OUT, 'Правила и механики — всё.md'), rLines.join('\\n'), 'utf8');";
const end = src.indexOf(marker);

if (start < 0 || end < 0) {
  console.log('блок правил не найден, ничего не меняю');
  process.exit(0);
}

const replacement = `/* 3. правила — отдельный генератор: gen-rules-doc.mjs */
/* здесь не пишем, чтобы не перетирать актуальную версию */
`;

src = src.slice(0, start) + replacement + src.slice(end + marker.length);
fs.writeFileSync(p, src, 'utf8');
console.log('блок правил отвязан от общего генератора');
