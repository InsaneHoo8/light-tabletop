import fs from 'node:fs';

const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

function rep(old, neu, label) {
  if (!e.includes(old)) throw new Error('НЕ НАЙДЕНО: ' + label);
  e = e.replace(old, neu);
  console.log('ok: ' + label);
}

/* поля режима */
rep(`    extraActions: 0,`, `    extraActions: 0,
    comboMode: false,
    comboAltarUsed: false,
    comboNeuroUsed: false,`, 'поля режима связки');

/* включение режима */
rep(`    s.players.push(makePlayer(i, ch, !!opts.noArtifactLimit));`,
    `    s.players.push(makePlayer(i, ch, !!opts.noArtifactLimit));
    if (opts.comboMode) s.players[s.players.length - 1].comboMode = true;`,
    'включение режима связки');

/* сброс флагов в конце хода */
rep(`  p.tax = 0;
  if (p.weakenTurns > 0) {`,
    `  p.tax = 0;
  p.comboAltarUsed = false;
  p.comboNeuroUsed = false;
  if (p.weakenTurns > 0) {`,
    'сброс флагов связки');

/* поведение связки */
rep(`function botMove(s, noise) {
  if (s.phase !== 'main') return null;
  var p = me(s);`,
    `function comboMove(s, p) {
  if (!p.comboMode) return null;

  var altarIdx = p.hand.indexOf('altar');
  var neuroIdx = p.hand.indexOf('neyrostim');
  if (altarIdx < 0 || neuroIdx < 0) return null;

  var list = candidates(s, p).filter(function (c) { return c.action === 'useArtifact'; });
  var byIndex = function (idx) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].picks.artifact === idx) return list[i];
    }
    return null;
  };

  /* первый шаг: алтарь */
  if (!p.comboAltarUsed && !p.comboNeuroUsed) {
    return byIndex(altarIdx) || null;
  }

  /* последний шаг: нейростимулятор, когда действий больше не осталось */
  if (p.comboAltarUsed && !p.comboNeuroUsed && p.extraActions === 0) {
    return byIndex(neuroIdx) || null;
  }
  return null;
}

function botMove(s, noise) {
  if (s.phase !== 'main') return null;
  var p = me(s);

  if (p.comboMode) {
    var comboPick = comboMove(s, p);
    if (comboPick) return comboPick;
  }`,
    'поведение связки');

/* отметки об использовании */
rep(`    if (p.charId === 'omnis' && !p.artExtraUsed) {`, `    if (p.charId === 'omnis' && !p.artExtraUsed) {`, 'заглушка');

fs.writeFileSync(ep, e, 'utf8');
console.log('движок: связка');
