import fs from 'node:fs';

const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

/* убираем отладочную строку */
e = e.replace(/  if \(global\.__comboDebug\)[^\n]*\n/, '');

const start = e.indexOf('function comboMove(s, p) {');
if (start < 0) throw new Error('нет comboMove');
let depth = 0;
let end = start;
for (let i = start; i < e.length; i++) {
  if (e[i] === '{') depth++;
  else if (e[i] === '}') {
    depth--;
    if (depth === 0) { end = i + 1; break; }
  }
}

const neu = `function comboMove(s, p) {
  if (!p.comboMode) return null;

  var altarIdx = p.hand.indexOf('altar');
  var neuroIdx = p.hand.indexOf('neyrostim');

  var list = candidates(s, p).filter(function (c) { return c.action === 'useArtifact'; });
  var byIndex = function (idx) {
    for (var i = 0; i < list.length; i++) {
      var ai = list[i].picks.artifact === undefined ? 0 : list[i].picks.artifact;
      if (ai === idx) return list[i];
    }
    return null;
  };

  /* первый шаг: оба в руке, начинаем с алтаря */
  if (!p.comboAltarUsed && !p.comboNeuroUsed && altarIdx >= 0 && neuroIdx >= 0) {
    return byIndex(altarIdx) || null;
  }

  /* последний шаг: нейростимулятор, когда действий больше не осталось */
  if (p.comboAltarUsed && !p.comboNeuroUsed && neuroIdx >= 0 && p.extraActions === 0) {
    return byIndex(neuroIdx) || null;
  }
  return null;
}`;

e = e.slice(0, start) + neu + e.slice(end);
fs.writeFileSync(ep, e, 'utf8');
console.log('поведение связки исправлено');
