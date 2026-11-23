import fs from 'node:fs';

const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

function rep(old, neu, label) {
  if (!e.includes(old)) throw new Error('не найдено: ' + label);
  e = e.replace(old, neu);
  console.log('ok: ' + label);
}

rep(`  var aggro = s.aggression || 0;
  var dmgMul = 1.1 * (1 + aggro * 1.5);
  var defMul = 1 - aggro * 0.9;`,
    `  var aggro = s.aggression || 0;
  var caution = s.caution || 0;
  var dmgMul = 1.1 * (1 + aggro * 1.5) * (1 - caution * 0.45);
  var defMul = (1 - aggro * 0.9) * (1 + caution * 2);`,
    'множители осторожности');

rep(`  var s = {
    aggression: opts.aggression || 0,`,
    `  var s = {
    aggression: opts.aggression || 0,
    caution: opts.caution || 0,`,
    'поле осторожности');

/* при осторожности управление ценится выше, а самоурон бьёт сильнее по оценке */
rep(`      if (who === 'self') val -= n * dmgMul * (1 - aggro * 0.7);`,
    `      if (who === 'self') val -= n * dmgMul * (1 - aggro * 0.7) * (1 + caution);`,
    'самоурон при осторожности');

rep(`    else if (op.t === 'skip') {
      val += 4.0 * count * (1 + danger);
    }`,
    `    else if (op.t === 'skip') {
      val += 4.0 * count * (1 + danger) * (1 + caution * 0.6);
    }`,
    'контроль при осторожности');

fs.writeFileSync(ep, e, 'utf8');

const sp = 'game-lab/tools/sim-report.mjs';
let s = fs.readFileSync(sp, 'utf8');
if (!s.includes('caution')) {
  s = s.replace(
    "aggression: process.env.AGGRO === '1' ? 1 : 0",
    "aggression: process.env.AGGRO === '1' ? 1 : 0, caution: process.env.CAUTION === '1' ? 1 : 0"
  );
  fs.writeFileSync(sp, s, 'utf8');
  console.log('отчёт: режим осторожности');
}
