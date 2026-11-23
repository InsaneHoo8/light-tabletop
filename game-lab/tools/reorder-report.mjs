import fs from 'node:fs';

const p = 'game-lab/tools/sim-report.mjs';
let src = fs.readFileSync(p, 'utf8');

const startMark = "lines.push('## Кто чаще всего применял артефакты');";
const endMark = "lines.push('## Урон и лечение по персонажам');";
const readMark = "lines.push('## Как читать отчёт');";

const a = src.indexOf(startMark);
const b = src.indexOf(endMark);
if (a < 0 || b < 0 || b < a) throw new Error('маркеры не найдены');

let middle = src.slice(a, b);
middle = middle.split('lines.push(').join('tail.push(');
middle = "const tail = [];\n\n" + middle;

src = src.slice(0, a) + middle + src.slice(b);

const r = src.indexOf(readMark);
if (r < 0) throw new Error('нет раздела «как читать»');
src = src.slice(0, r) + "lines.push(...tail);\n\n" + src.slice(r);

fs.writeFileSync(p, src, 'utf8');
console.log('разделы со способностями и артефактами перенесены в конец');
