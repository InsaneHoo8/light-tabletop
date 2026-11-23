import fs from 'node:fs';

const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

function rep(old, neu, label) {
  if (!e.includes(old)) throw new Error('не найдено: ' + label);
  e = e.replace(old, neu);
  console.log('ok: ' + label);
}

rep(`  if (s.preferExtra && ops.some(function (o) { return o.t === 'extraAction'; })) {
    val *= 2.5;
  }`,
    `  if (s.preferExtra && ops.some(function (o) { return o.t === 'extraAction'; })) {
    val *= 2.5;
  }
  if (s.preferShield && ops.some(function (o) { return o.t === 'shield'; })) {
    val *= 2.5;
  }`,
    'приоритет щиту');

rep(`    preferExtra: !!opts.preferExtra,`,
    `    preferExtra: !!opts.preferExtra,
    preferShield: !!opts.preferShield,`,
    'поле приоритета щита');

fs.writeFileSync(ep, e, 'utf8');
console.log('движок: приоритет щиту');

const sp = 'game-lab/tools/sim-report.mjs';
let s = fs.readFileSync(sp, 'utf8').replace(/\r\n/g, '\n');
if (!s.includes('PREFER_SHIELD')) {
  s = s.replace(
    "preferExtra: process.env.PREFER_EXTRA === '1'",
    "preferExtra: process.env.PREFER_EXTRA === '1', preferShield: process.env.PREFER_SHIELD === '1'"
  );
  fs.writeFileSync(sp, s, 'utf8');
  console.log('отчёт: приоритет щиту');
}
