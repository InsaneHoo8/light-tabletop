import fs from 'node:fs';

const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

const start = e.indexOf('function priorityMove(s, p) {');
if (start < 0) throw new Error('нет priorityMove');
let depth = 0;
let end = start;
for (let i = start; i < e.length; i++) {
  if (e[i] === '{') depth++;
  else if (e[i] === '}') {
    depth--;
    if (depth === 0) { end = i + 1; break; }
  }
}

const neu = `function priorityMove(s, p) {
  var list = candidates(s, p);
  var byAction = function (a) {
    return list.filter(function (c) { return c.action === a; });
  };

  /* 1. артефакт — самое приоритетное */
  var artifacts = byAction('useArtifact');
  if (artifacts.length) return pickBest(artifacts);

  /* 2. взять артефакт */
  var takes = byAction('take');
  if (takes.length) return pickBest(takes);

  /* 3. способности */
  var abilities = byAction('ability');
  if (abilities.length) return pickBest(abilities);

  /* 4. нет энергии на способность — меняем артефакт на энергию */
  var exchanges = list.filter(function (c) { return c.action === 'exchange' && c.picks.mode === 0; });
  if (p.abilities.length && exchanges.length) return pickBest(exchanges);

  /* 5. обычная атака — последняя */
  var attacks = byAction('attack');
  if (attacks.length) return pickBest(attacks);

  var rest = list.filter(function (c) {
    return c.action === 'trade' || c.action === 'restore' || c.action === 'exchange';
  });
  if (rest.length) return pickBest(rest);

  return { action: 'pass', picks: {}, score: 0 };
}`;

e = e.slice(0, start) + neu + e.slice(end);
fs.writeFileSync(ep, e, 'utf8');
console.log('порядок: артефакт, взятие, способность, обмен, атака');
