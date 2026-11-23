import fs from 'node:fs';

const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

function rep(old, neu, label) {
  if (!e.includes(old)) throw new Error('не найдено: ' + label);
  e = e.replace(old, neu);
  console.log('ok: ' + label);
}

/* приоритет картам, дающим дополнительное действие */
rep(`  return val;
}

function candidates(s, p) {`,
    `  if (s.preferExtra && ops.some(function (o) { return o.t === 'extraAction'; })) {
    val *= 2.5;
  }
  return val;
}

function candidates(s, p) {`,
    'приоритет дополнительному действию');

rep(`  var s = {
    aggression: opts.aggression || 0,`,
    `  var s = {
    preferExtra: !!opts.preferExtra,
    aggression: opts.aggression || 0,`,
    'поле приоритета');

fs.writeFileSync(ep, e, 'utf8');
console.log('движок: приоритет доп. действию');

const sp = 'game-lab/tools/sim-report.mjs';
let s = fs.readFileSync(sp, 'utf8').replace(/\r\n/g, '\n');
if (!s.includes('PREFER_EXTRA')) {
  s = s.replace(
    "styles: process.env.STYLES ? process.env.STYLES.split(',') : null",
    "styles: process.env.STYLES ? process.env.STYLES.split(',') : null, preferExtra: process.env.PREFER_EXTRA === '1'"
  );
  fs.writeFileSync(sp, s, 'utf8');
  console.log('отчёт: приоритет доп. действию');
}
