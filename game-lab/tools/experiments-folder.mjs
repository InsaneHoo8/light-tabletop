import fs from 'node:fs';

/* 1. Эксперименты кладём в отдельную папку */
const sp = 'game-lab/tools/sim-report.mjs';
let s = fs.readFileSync(sp, 'utf8').replace(/\r\n/g, '\n');

const old = "const patchFolder = 'Патч ' + PATCH;";
const neu = "const patchFolder = ESSENCE.startsWith('Эксперимент') ? 'Эксперименты' : 'Патч ' + PATCH;";

if (!s.includes(old)) throw new Error('не найдено место папки');
s = s.replace(old, neu);
fs.writeFileSync(sp, s, 'utf8');
console.log('генератор: эксперименты в отдельную папку');
