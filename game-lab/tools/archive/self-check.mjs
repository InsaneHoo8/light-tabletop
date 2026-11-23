/* Самопроверка движка + автопрогон партий.
   Запуск: node game-lab/tools/self-check.mjs */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const E = require(path.join(here, '..', 'demo', 'engine.js'));

let failed = 0;
function check(name, cond, extra) {
  if (cond) {
    console.log('OK   ' + name);
  } else {
    failed++;
    console.log('FAIL ' + name + (extra ? ' -> ' + extra : ''));
  }
}

/* --- 1. Базовые правила --- */
{
  const s = E.newGame(12345);
  check('старт: ваш ход', s.phase === 'you');
  check('старт: очки нулевые', s.you.points === 0 && s.bot.points === 0);

  const r1 = E.playerAct(s, 'gather');
  check('сбор всегда удаётся', r1.ok === true, r1.text);
  check('грамматика: «Вы собрали»', /^Вы собрали/.test(r1.text), r1.text);
  const total = s.you.res.wood + s.you.res.metal + s.you.res.food;
  check('сбор даёт ровно две единицы', total === 2, 'всего ' + total);
  check('сбор переводит в фазу соперника', s.phase === 'bot');

  const r2 = E.playerAct(s, 'gather');
  check('второй ход подряд запрещён', r2.ok === false, r2.text);

  const r3 = E.botAct(s);
  check('ход соперника проходит', r3.ok === true, r3.text);
  check('после соперника снова ваш ход', s.phase === 'you');
  check('раунд вырос', s.round === 2, 'раунд ' + s.round);
}

/* --- 2. Отказ по нехватке ресурсов объясняется --- */
{
  const s = E.newGame(777);
  const r = E.playerAct(s, 'bench');
  check('верстак без ресурсов недоступен', r.ok === false);
  check('в отказе названо, чего не хватает', /металл: нужно 2/.test(r.text), r.text);
  check('отказ не тратит ход', s.phase === 'you');
}

/* --- 3. Постройка, обмен, кубик --- */
{
  const s = E.newGame(4242);
  s.you.res = { wood: 5, metal: 5, food: 5 };
  const r = E.playerAct(s, 'hut');
  check('хижина строится', r.ok && s.you.points === 1, r.text);
  check('хижина списывает доски и еду', s.you.res.wood === 3 && s.you.res.food === 4);

  const s2 = E.newGame(4242);
  s2.you.res = { wood: 4, metal: 0, food: 0 };
  const r2 = E.playerAct(s2, 'trade');
  check('обмен идёт', r2.ok && s2.you.res.metal === 1 && s2.you.res.wood === 2, r2.text);

  const s3 = E.newGame(99);
  const r3 = E.playerAct(s3, 'risk');
  check('кубик назван в тексте', /выпало [1-6]/.test(r3.text), r3.text);
}

/* --- 4. Детерминизм: один сид — одна партия --- */
{
  function play(seed) {
    const s = E.newGame(seed);
    const texts = [];
    let guard = 0;
    while (s.phase !== 'over' && guard++ < 400) {
      if (s.phase === 'you') texts.push(E.playerAct(s, E.chooseFor(s, 'you')).text);
      else texts.push(E.botAct(s).text);
    }
    return texts.join('|') + '#' + s.you.points + ':' + s.bot.points;
  }
  const a = play(2024);
  const b = play(2024);
  check('один сид даёт ту же партию', a === b);
  check('разные сиды дают разные партии', play(2024) !== play(2025));
}

/* --- 5. Отмена хода откатывает и случайность --- */
{
  const s = E.newGame(31337);
  E.playerAct(s, 'gather');
  const before = JSON.stringify(s);
  const snap = JSON.parse(before);
  E.botAct(s);
  check('состояние изменилось после ответа', JSON.stringify(s) !== before);
  const restored = Object.assign(s, snap);
  check('снимок восстанавливает партию целиком', JSON.stringify(restored) === before);
}

/* --- 6. Автопрогон: 500 партий --- */
{
  const N = 500;
  let youWins = 0;
  let botWins = 0;
  let rounds = 0;
  let stalls = 0;
  const lengths = [];
  for (let i = 0; i < N; i++) {
    const s = E.newGame(100000 + i);
    let guard = 0;
    while (s.phase !== 'over' && guard++ < 400) {
      if (s.phase === 'you') E.playerAct(s, E.chooseFor(s, 'you'));
      else E.botAct(s);
    }
    if (s.phase !== 'over') {
      stalls++;
      continue;
    }
    if (s.winner === 'you') youWins++;
    else botWins++;
    rounds += s.round;
    lengths.push(s.round);
  }
  lengths.sort((a, b) => a - b);
  const median = lengths[Math.floor(lengths.length / 2)];
  console.log('');
  console.log('Автопрогон, ' + N + ' партий (одинаковая политика за оба стола):');
  console.log('  побед первого стола: ' + youWins + ', второго: ' + botWins + ', зависаний: ' + stalls);
  console.log('  средняя длина: ' + (rounds / Math.max(1, N - stalls)).toFixed(1) + ' раундов, медиана ' + median + ', максимум ' + (lengths[lengths.length - 1] || 0));
  check('ни одна партия не зависла', stalls === 0);
  check('партии заканчиваются за разумное время', median > 0 && median < 60, 'медиана ' + median);
}

console.log('');
console.log(failed === 0 ? 'Все проверки пройдены.' : 'Провалено проверок: ' + failed);
process.exit(failed === 0 ? 0 : 1);
