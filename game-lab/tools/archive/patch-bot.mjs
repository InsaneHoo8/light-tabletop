import fs from 'node:fs';

const path = 'game-lab/arena/engine.js';
let src = fs.readFileSync(path, 'utf8');

function replaceOnce(old, neu, label) {
  if (!src.includes(old)) throw new Error('не найдено: ' + label);
  src = src.replace(old, neu);
  console.log('ok: ' + label);
}

replaceOnce(
  'function scoreOps(ops, s, actor, target) {',
  `/* Насколько персонаж в опасности: ноль — целый, единица — на грани. */
function dangerLevel(p) {
  return Math.max(0, Math.min(1, 1 - p.hp / Math.max(1, p.maxHp)));
}

/* Средний урон, который может прилететь за круг. */
function incomingThreat(s, actor) {
  var sum = 0;
  for (var i = 0; i < s.players.length; i++) {
    if (i === actor.idx || !s.players[i].alive) continue;
    sum += s.players[i].dmg;
  }
  return Math.max(3, sum);
}

function scoreOps(ops, s, actor, target) {
  var danger = dangerLevel(actor);
  var threat = incomingThreat(s, actor);`,
  'оценка опасности'
);

replaceOnce(
  `    } else if (op.t === 'heal') {
      var missingHp = actor.maxHp - actor.hp;
      val += Math.min(op.n || 0, missingHp) * 0.8;
    } else if (op.t === 'shield' || op.t === 'dmgReduce' || op.t === 'blockNext') {
      val += (op.n || 3) * 0.7;
    } else if (op.t === 'skip') val += 4.0 * count;`,
  `    } else if (op.t === 'heal') {
      var missingHp = actor.maxHp - actor.hp;
      val += Math.min(op.n || 0, missingHp) * (1 + danger * 2);
    } else if (op.t === 'shield' || op.t === 'dmgReduce' || op.t === 'blockNext') {
      var absorb = Math.min(op.n || 3, threat);
      val += absorb * (1 + danger * 2.5);
    } else if (op.t === 'skip') {
      val += 4.0 * count * (1 + danger);
    }`,
  'защита по угрозе'
);

fs.writeFileSync(path, src, 'utf8');
