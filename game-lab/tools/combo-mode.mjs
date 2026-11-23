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

/* поведение: сначала алтарь, потом на последнем действии нейростимулятор */
rep(`function botMove(s, noise) {
  if (s.phase !== 'main') return null;
  var p = me(s);`,
    `function comboMove(s, p) {
  if (!p.comboMode) return null;
  var altarIdx = -1;
  var neuroIdx = -1;
  for (var ci = 0; ci < p.hand.length; ci++) {
    if (p.hand[ci] === 'altar') altarIdx = ci;
    if (p.hand[ci] === 'neyrostim') neuroIdx = ci;
  }
  if (altarIdx < 0 || neuroIdx < 0) return null;

  /* первый шаг: алтарь */
  if (!p.comboAltarUsed && !p.comboNeuroUsed) {
    var optsA = [altarIdx, neuroIdx];
    for (var oi = 0; oi < optsA.length; oi++) {
      var candA = candidates(s, p).filter(function (c) {
        return c.action === 'useArtifact' && c.picks.artifact === optsA[0];
      });
      if (candA.length) return candA[0];
    }
    return null;
  }

  /* последний шаг: нейростимулятор, когда действий больше не осталось */
  if (p.comboAltarUsed && !p.comboNeuroUsed && p.extraActions === 0) {
    var candB = candidates(s, p).filter(function (c) {
      return c.action === 'useArtifact' && c.picks.artifact === neuroIdx;
    });
    if (candB.length) return candB[0];
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

/* не обменивать карты связки */
rep(`    if (art.freeAction) freeAction = true;`, `    if (art.freeAction) freeAction = true;`, 'проверка без изменений');

fs.writeFileSync(ep, e, 'utf8');
console.log('движок: связка алтарь и нейростимулятор');
