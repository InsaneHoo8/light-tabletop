import fs from 'node:fs';

const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

function rep(old, neu, label) {
  if (!e.includes(old)) throw new Error('не найдено: ' + label);
  e = e.replace(old, neu);
  console.log('ok: ' + label);
}

rep(`    preferShield: !!opts.preferShield,`,
    `    preferShield: !!opts.preferShield,
    priority: !!opts.priority,`,
    'поле приоритетов');

/* строгий порядок: способности, восстановление энергии, артефакты, атака */
rep(`function botMove(s, noise) {
  if (s.phase !== 'main') return null;
  var p = me(s);
  var list = candidates(s, p);`,
    `function pickBest(list) {
  var best = list[0];
  for (var i = 1; i < list.length; i++) {
    if (list[i].score > best.score) best = list[i];
  }
  return best;
}

/* Жёсткий порядок: пока есть способность — играем её; нет энергии — добываем её;
   затем артефакты; обычная атака только когда не осталось ничего другого. */
function priorityMove(s, p) {
  var list = candidates(s, p);
  var byAction = function (a) {
    return list.filter(function (c) { return c.action === a; });
  };

  var abilities = byAction('ability');
  if (abilities.length) return pickBest(abilities);

  var exchanges = list.filter(function (c) { return c.action === 'exchange' && c.picks.mode === 0; });
  if (exchanges.length) return pickBest(exchanges);

  var artifacts = byAction('useArtifact');
  if (artifacts.length) return pickBest(artifacts);

  var attacks = byAction('attack');
  if (attacks.length) return pickBest(attacks);

  var rest = list.filter(function (c) {
    return c.action === 'take' || c.action === 'trade' || c.action === 'restore' || c.action === 'exchange';
  });
  if (rest.length) return pickBest(rest);

  return { action: 'pass', picks: {}, score: 0 };
}

function botMove(s, noise) {
  if (s.phase !== 'main') return null;
  var p = me(s);
  if (s.priority) return priorityMove(s, p);
  var list = candidates(s, p);`,
    'строгий порядок действий');

fs.writeFileSync(ep, e, 'utf8');
console.log('движок: приоритет способностей');

const sp = 'game-lab/tools/sim-report.mjs';
let s = fs.readFileSync(sp, 'utf8').replace(/\r\n/g, '\n');
if (!s.includes('PRIORITY')) {
  s = s.replace(
    "preferShield: process.env.PREFER_SHIELD === '1'",
    "preferShield: process.env.PREFER_SHIELD === '1', priority: process.env.PRIORITY === '1'"
  );
  fs.writeFileSync(sp, s, 'utf8');
  console.log('отчёт: режим приоритетов');
}
