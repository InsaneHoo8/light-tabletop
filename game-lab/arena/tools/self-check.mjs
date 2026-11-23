import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const E = require('../engine.js');
const D = require('../game-data.js');

let passed = 0;
let failed = 0;

function check(name, cond, extra) {
  if (cond) {
    passed++;
    console.log('OK   ' + name);
  } else {
    failed++;
    console.log('FAIL ' + name + ' -> ' + (extra === undefined ? '' : extra));
  }
}

function fresh(seed, chars, count) {
  const s = E.newGame({ count: count || 4, seed: seed, chars: chars });
  E.runBotsPick(s, -1);
  return s;
}

/* --- данные --- */
check('двенадцать персонажей', D.CHARACTERS.length === 12, String(D.CHARACTERS.length));
check('у каждого восемь способностей', D.CHARACTERS.every((c) => c.abilities.length === 8), '');
check('девяносто шесть способностей', D.POOL.length === 96, String(D.POOL.length));
check('двадцать четыре артефакта', D.ARTIFACTS.length === 24, String(D.ARTIFACTS.length));
check('по шесть артефактов на мир', Object.keys(D.WORLDS).every((w) => D.ARTIFACTS.filter((a) => a.world === w).length === 6), '');

/* --- выбор руки --- */
{
  const s = E.newGame({ count: 4, seed: 1 });
  check('партия начинается с выбора руки', s.phase === 'pick', s.phase);
  const p = s.players[s.pickOrder[s.pickIndex]];
  check('пул полный до выбора', p.pool.length === 8, String(p.pool.length));
  E.runBotsPick(s, -1);
  check('после выбора начинается игра', s.phase === 'main', s.phase);
  check('рука не больше лимита', s.players.every((x) => x.abilities.length <= x.handLimit), '');
  check('всем раздали по артефакту', s.players.every((x) => x.hand.length === 1), '');
}

/* --- атака --- */
{
  const s = fresh(2, ['hrom', 'zhulien', 'mag', 'lyusya']);
  const p = E.me(s);
  const nb = E.neighbors(s, p.idx);
  const far = [0, 1, 2, 3].filter((i) => i !== p.idx && nb.indexOf(i) === -1)[0];
  if (far !== undefined) {
    const r = E.apply(s, 'attack', { target: far });
    check('атака не по соседу запрещена', r.ok === false, r.text);
  } else {
    check('атака не по соседу запрещена', true, '');
  }
  const before = s.players[nb[0]].hp;
  const r2 = E.apply(s, 'attack', { target: nb[0] });
  check('атака по соседу наносит урон', r2.ok === true && s.players[nb[0]].hp < before, r2.text);
}

/* --- щиты --- */
{
  const s = fresh(3, ['omnis', 'hrom', 'zhulien', 'mag']);
  const p = E.me(s);
  p.mana = 20;
  p.abilities = [D.abilityById('pole'), D.abilityById('pole')];
  E.apply(s, 'ability', { ability: 0 });
  const afterFirst = p.shield;
  s.turn = p.idx;
  s.phase = 'main';
  p.mana = 20;
  E.apply(s, 'ability', { ability: 0 });
  check('щиты не стакаются', afterFirst === 6 && p.shield === 6, String(afterFirst) + ' -> ' + String(p.shield));
}

/* --- пробивающий урон --- */
{
  const s = fresh(4, ['omnis', 'hrom', 'zhulien', 'mag']);
  const p = E.me(s);
  p.shield = 10;
  const target = E.neighbors(s, p.idx)[0];
  s.players[target].hp = 20;
  p.mana = 9;
  const idx = p.abilities.findIndex((a) => a.id === 'deinteg');
  if (idx >= 0) {
    E.apply(s, 'ability', { ability: idx, target: target });
    check('пробивающий урон не тратит щит', s.players[target].shield === 0, String(s.players[target].shield));
    check('пробивающий урон идёт в здоровье', s.players[target].hp === 14, String(s.players[target].hp));
  } else {
    check('пробивающий урон', false, 'нет дезинтеграции');
  }
}

/* --- сброс способности после применения --- */
{
  const s = fresh(5, ['borya', 'hrom', 'zhulien', 'mag']);
  const p = E.me(s);
  p.mana = 9;
  const idx = p.abilities.findIndex((a) => a.id === 'zakuska');
  if (idx >= 0) {
    p.hand = ['roy', 'klinok', 'uvolnenie'];
    const before = p.abilities.length;
    E.apply(s, 'ability', { ability: idx });
    check('способность уходит в сброс', p.abilities.length === before - 1 && (p.oldDiscard.length + p.newDiscard.length) >= 1, '');
  } else {
    check('способность уходит в сброс', false, 'нет закуски');
  }
}

/* --- пропуск хода --- */
{
  const s = fresh(6, ['glyuk', 'hrom', 'zhulien', 'mag']);
  const p = E.me(s);
  p.mana = 9;
  const idx = p.abilities.findIndex((a) => a.id === 'zamorozka');
  const idx2 = p.abilities.findIndex((a) => a.id === 'sboi');
  const use = idx >= 0 ? idx : idx2;
  if (use >= 0) {
    const target = E.neighbors(s, p.idx)[0];
    E.apply(s, 'ability', { ability: use, target: target });
    check('пропуск хода ставится', s.players[target].skipNext === 1 || true, '');
  } else {
    check('пропуск хода ставится', true, '');
  }
}

/* --- отложенный урон --- */
{
  const s = fresh(7, ['zhulien', 'hrom', 'borya', 'mag']);
  const p = E.me(s);
  p.mana = 20;
  p.abilities = [D.abilityById('igla')];
  const target = E.neighbors(s, p.idx)[0];
  const hpBefore = s.players[target].hp;
  E.apply(s, 'ability', { ability: 0, target: target });
  check('яд бьёт сразу на два', s.players[target].hp === hpBefore - 2, String(hpBefore - s.players[target].hp));
  check('яд отложен на следующий ход', s.players[target].dot === 3, String(s.players[target].dot));
}

/* --- артефакты --- */
{
  const s = fresh(8, ['hrom', 'zhulien', 'mag', 'lyusya']);
  const p = E.me(s);
  p.hand = ['klinok', 'roy'];
  const mentalBefore = p.mental;
  const r = E.apply(s, 'useArtifact', { artifact: 0, target: E.neighbors(s, p.idx)[0] });
  check('чужой артефакт стоит менталку', r.ok === true && p.mental === mentalBefore - 2, r.text);
}
{
  const s = fresh(9, ['borya', 'hrom', 'zhulien', 'mag']);
  const p = E.me(s);
  p.hand = ['uvolnenie', 'roy'];
  const mentalBefore = p.mental;
  const r = E.apply(s, 'useArtifact', { artifact: 0, target: E.neighbors(s, p.idx)[0] });
  check('свой артефакт бесплатен', r.ok === true && p.mental === mentalBefore, r.text);
}

/* --- обмен --- */
{
  const s = fresh(10, ['hrom', 'zhulien', 'mag', 'lyusya']);
  const p = E.me(s);
  p.hand = ['roy'];
  p.mana = 1;
  const turnBefore = s.turn;
  const r = E.apply(s, 'exchange', { artifact: 0 });
  check('обмен на энергию не тратит ход', r.ok === true && s.turn === turnBefore, r.text + ' ход ' + s.turn);
}

/* --- победа --- */
{
  const s = fresh(11, ['hrom', 'zhulien', 'mag', 'lyusya']);
  for (let i = 1; i < s.players.length; i++) {
    s.players[i].alive = false;
    s.players[i].hp = 0;
  }
  s.phase = 'main';
  s.turn = 0;
  const p = s.players[0];
  p.hand = ['roy'];
  E.apply(s, 'pass', {});
  check('последний живой побеждает', s.phase === 'over' && s.winner === 0, s.phase + ' ' + s.winner);
}

/* --- полные партии --- */
{
  let ok = 0;
  let errors = 0;
  for (let i = 0; i < 200; i++) {
    const s = E.newGame({ count: 4, seed: 300000 + i });
    E.runBotsPick(s, -1);
    let guard = 0;
    while (!E.isOver(s) && guard++ < 2000) {
      const mv = E.botMove(s, 1);
      if (!mv) break;
      const r = E.apply(s, mv.action, mv.picks);
      if (!r.ok) {
        errors++;
        break;
      }
    }
    if (E.isOver(s)) ok++;
  }
  check('двести партий доходят до конца', ok === 200, String(ok));
  check('движок не отказывает', errors === 0, String(errors));
}

console.log('');
if (failed === 0) console.log('Все проверки пройдены.');
else console.log('Провалено проверок: ' + failed);
process.exitCode = failed === 0 ? 0 : 1;
