import fs from 'node:fs';

const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

function rep(old, neu, label) {
  if (!e.includes(old)) throw new Error('не найдено: ' + label);
  e = e.replace(old, neu);
  console.log('ok: ' + label);
}

/* агрессия бота: 0 — обычный, 1 — максимально агрессивный */
rep(`function scoreOps(ops, s, actor, target) {
  var danger = dangerLevel(actor);
  var threat = incomingThreat(s, actor);`,
    `function scoreOps(ops, s, actor, target) {
  var danger = dangerLevel(actor);
  var threat = incomingThreat(s, actor);
  var aggro = s.aggression || 0;
  var dmgMul = 1.1 * (1 + aggro * 1.5);
  var defMul = 1 - aggro * 0.9;`,
    'множители агрессии');

rep(`    if (op.t === 'dmg') {
      if (who === 'self') val -= n * 1.1;
      else val += n * 1.1 * count;
    }`,
    `    if (op.t === 'dmg') {
      if (who === 'self') val -= n * dmgMul * (1 - aggro * 0.7);
      else val += n * dmgMul * count;
    }`,
    'урон с агрессией');

rep(`    } else if (op.t === 'heal') {
      var missingHp = actor.maxHp - actor.hp;
      val += Math.min(op.n || 0, missingHp) * (1 + danger * 2);
    } else if (op.t === 'shield' || op.t === 'dmgReduce' || op.t === 'blockNext') {
      var absorb = Math.min(op.n || 3, threat);
      val += absorb * (1 + danger * 2.5);
    }`,
    `    } else if (op.t === 'heal') {
      var missingHp = actor.maxHp - actor.hp;
      val += Math.min(op.n || 0, missingHp) * (1 + danger * 2) * defMul;
    } else if (op.t === 'shield' || op.t === 'dmgReduce' || op.t === 'blockNext') {
      var absorb = Math.min(op.n || 3, threat);
      val += absorb * (1 + danger * 2.5) * defMul;
    }`,
    'защита с агрессией');

rep(`  var s = {
    seed: seed,`,
    `  var s = {
    aggression: opts.aggression || 0,
    seed: seed,`,
    'поле агрессии');

fs.writeFileSync(ep, e, 'utf8');

/* передаём режим из отчёта */
const sp = 'game-lab/tools/sim-report.mjs';
let s = fs.readFileSync(sp, 'utf8');
if (!s.includes('aggression')) {
  s = s.replace(
    "  const s = E.newGame({ count: COUNT, seed: 800000 + i });",
    "  const s = E.newGame({ count: COUNT, seed: 800000 + i, aggression: process.env.AGGRO === '1' ? 1 : 0 });"
  );
  fs.writeFileSync(sp, s, 'utf8');
  console.log('отчёт: режим агрессии');
}
