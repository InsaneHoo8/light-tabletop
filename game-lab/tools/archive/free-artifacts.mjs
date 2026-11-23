import fs from 'node:fs';

const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

function rep(old, neu, label) {
  if (!e.includes(old)) throw new Error('НЕ НАЙДЕНО: ' + label);
  e = e.replace(old, neu);
  console.log('ok: ' + label);
}

rep(`    var payMental = art.world !== p.world ? art.cost : 0;`,
    `    var payMental = art.world !== p.world ? art.cost : 0;
    if (s.freeArtifacts) payMental = 0;`,
    'флаг бесплатных артефактов');

rep(`  var s = {
    preferExtra: !!opts.preferExtra,`,
    `  var s = {
    freeArtifacts: !!opts.freeArtifacts,
    preferExtra: !!opts.preferExtra,`,
    'поле флага');

fs.writeFileSync(ep, e, 'utf8');

const sp = 'game-lab/tools/sim-report.mjs';
let s = fs.readFileSync(sp, 'utf8').replace(/\r\n/g, '\n');
if (!s.includes('FREE_ART')) {
  s = s.replace(
    "comboMode: process.env.COMBO === '1'",
    "comboMode: process.env.COMBO === '1', freeArtifacts: process.env.FREE_ART === '1'"
  );
  fs.writeFileSync(sp, s, 'utf8');
  console.log('отчёт: флаг бесплатных артефактов');
}
