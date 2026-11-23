import fs from 'node:fs';

const sp = 'game-lab/tools/sim-report.mjs';
let s = fs.readFileSync(sp, 'utf8').replace(/\r\n/g, '\n');

const old = "styles: process.env.STYLES ? process.env.STYLES.split(',') : null";
const neu = `styles: process.env.STYLES
    ? process.env.STYLES.split(',')
    : (process.env.AGGRO === '1' || process.env.CAUTION === '1' || process.env.MIXED === '1' || process.env.PRIORITY === '1'
        ? null
        : ['random', 'random', 'random', 'random'])`;

if (!s.includes(old)) throw new Error('не найдена передача стилей');
s = s.replace(old, neu);
fs.writeFileSync(sp, s, 'utf8');
console.log('симуляция по умолчанию: все боты случайные');
