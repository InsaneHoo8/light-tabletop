import fs from 'node:fs';

const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

function rep(old, neu, label) {
  if (!e.includes(old)) throw new Error('не найдено: ' + label);
  e = e.replace(old, neu);
  console.log('ok: ' + label);
}

rep(`    priority: !!opts.priority,`,
    `    priority: !!opts.priority,
    counterAware: !!opts.counterAware,`,
    'поле контр-оценки');

/* оценка карт, мешающих артефактам и способностям, с поправкой на стол */
rep(`  if (s.preferShield && ops.some(function (o) { return o.t === 'shield'; })) {
    val *= 2.5;
  }`,
    `  if (s.preferShield && ops.some(function (o) { return o.t === 'shield'; })) {
    val *= 2.5;
  }
  if (s.counterAware) {
    var foeArtifacts = 0;
    var foeAbilities = 0;
    var foes = 0;
    for (var fi = 0; fi < s.players.length; fi++) {
      if (fi === actor.idx || !s.players[fi].alive) continue;
      foeArtifacts += s.players[fi].hand.length;
      foeAbilities += s.players[fi].abilities.length;
      foes++;
    }
    var avgArt = foes ? foeArtifacts / foes : 0;
    var avgAb = foes ? foeAbilities / foes : 0;
    for (var oi = 0; oi < ops.length; oi++) {
      var t = ops[oi].t;
      if (t === 'stealArtifact' || t === 'discardArtifact' || t === 'discardAllArtifacts' || t === 'noArtifacts') {
        val += avgArt * 1.5;
      }
      if (t === 'stealAbility' || t === 'discardAbility' || t === 'noAbilities') {
        val += avgAb * 0.8;
      }
    }
  }`,
    'контр-оценка по столу');

fs.writeFileSync(ep, e, 'utf8');
console.log('движок: контр-оценка');

const sp = 'game-lab/tools/sim-report.mjs';
let s = fs.readFileSync(sp, 'utf8').replace(/\r\n/g, '\n');
if (!s.includes('COUNTERS')) {
  s = s.replace(
    "priority: process.env.PRIORITY === '1'",
    "priority: process.env.PRIORITY === '1', counterAware: process.env.COUNTERS === '1'"
  );
  fs.writeFileSync(sp, s, 'utf8');
  console.log('отчёт: контр-оценка');
}
