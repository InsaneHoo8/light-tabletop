/* Тихая гавань — демо-движок.
   Чистая логика без DOM: работает и в браузере (window.GameEngine),
   и в Node (require) — чтобы можно было прогонять партии ботами.
   Все числа-заглушки, их задача — показать форму, а не баланс. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.GameEngine = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var RESOURCES = ['wood', 'metal', 'food'];
  var RES_NAME = { wood: 'доски', metal: 'металл', food: 'еда' };
  var WIN_POINTS = 8;

  var ACTIONS = [
    {
      id: 'gather',
      label: 'Собрать припасы',
      cost: null,
      summary: 'две случайные единицы ресурсов'
    },
    {
      id: 'hut',
      label: 'Построить хижину',
      cost: { wood: 2, food: 1 },
      points: 1,
      done: { you: 'построили хижину', bot: 'построил хижину' }
    },
    {
      id: 'bench',
      label: 'Построить верстак',
      cost: { metal: 2, wood: 1 },
      points: 2,
      done: { you: 'построили верстак', bot: 'построил верстак' }
    },
    {
      id: 'trade',
      label: 'Обменять доски на металл',
      cost: { wood: 2 },
      gives: { metal: 1 },
      done: { you: 'обменяли доски на металл', bot: 'обменял доски на металл' }
    },
    {
      id: 'risk',
      label: 'Рискнуть',
      cost: null,
      summary: 'бросок кубика: 3-6 — очко и ресурс, 1-2 — потеря ресурса'
    }
  ];

  function byId(id) {
    for (var i = 0; i < ACTIONS.length; i++) if (ACTIONS[i].id === id) return ACTIONS[i];
    return null;
  }

  function emptyRes() {
    return { wood: 0, metal: 0, food: 0 };
  }

  function newGame(seed) {
    if (seed === undefined || seed === null || !isFinite(seed)) seed = Math.floor(Math.random() * 900000) + 100000;
    seed = Math.abs(Math.floor(seed)) % 1000000000;
    return {
      seed: seed,
      rngState: seed | 0,
      round: 1,
      phase: 'you', // 'you' | 'bot' | 'over'
      winner: null,
      you: { points: 0, res: emptyRes() },
      bot: { points: 0, res: emptyRes() },
      moves: 0
    };
  }

  /* Детерминированный генератор: состояние живёт в объекте партии,
     поэтому снимок состояния = полный снимок случайности (нужно для отмены хода). */
  function rand(s) {
    s.rngState = (s.rngState + 0x6d2b79f5) | 0;
    var t = Math.imul(s.rngState ^ (s.rngState >>> 15), 1 | s.rngState);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function pick(s, arr) {
    return arr[Math.min(arr.length - 1, Math.floor(rand(s) * arr.length))];
  }

  function d6(s) {
    return 1 + Math.min(5, Math.floor(rand(s) * 6));
  }

  function cloneRes(r) {
    return { wood: r.wood, metal: r.metal, food: r.food };
  }

  function resText(r) {
    var parts = [];
    for (var i = 0; i < RESOURCES.length; i++) {
      var k = RESOURCES[i];
      if (r[k] > 0) parts.push(RES_NAME[k] + ' ' + r[k]);
    }
    return parts.length ? parts.join(', ') : 'пусто';
  }

  function listRes(diff) {
    var parts = [];
    for (var i = 0; i < RESOURCES.length; i++) {
      var k = RESOURCES[i];
      if (diff[k]) parts.push(RES_NAME[k] + (diff[k] > 0 ? ' +' : ' ') + diff[k]);
    }
    return parts.join(', ');
  }

  function addRes(r, diff) {
    for (var i = 0; i < RESOURCES.length; i++) {
      var k = RESOURCES[i];
      if (diff[k]) r[k] = Math.max(0, r[k] + diff[k]);
    }
  }

  function missing(who, cost) {
    var lack = [];
    for (var i = 0; i < RESOURCES.length; i++) {
      var k = RESOURCES[i];
      if (cost[k] && who.res[k] < cost[k]) {
        lack.push(RES_NAME[k] + ': нужно ' + cost[k] + ', есть ' + who.res[k]);
      }
    }
    return lack;
  }

  function costText(cost) {
    var parts = [];
    for (var i = 0; i < RESOURCES.length; i++) {
      var k = RESOURCES[i];
      if (cost[k]) parts.push(RES_NAME[k] + ' ' + cost[k]);
    }
    return parts.join(', ');
  }

  function sideName(side) {
    return side === 'you' ? 'Вы' : 'Соперник';
  }

  /* Русские глаголы различаются по лицу: «вы собрали», но «соперник собрал». */
  function verb(side, youForm, botForm) {
    return side === 'you' ? youForm : botForm;
  }

  function checkWin(s) {
    if (s.you.points >= WIN_POINTS) {
      s.phase = 'over';
      s.winner = 'you';
      return true;
    }
    if (s.bot.points >= WIN_POINTS) {
      s.phase = 'over';
      s.winner = 'bot';
      return true;
    }
    return false;
  }

  /* Возвращает { ok, text, tone } — text уже готов к озвучиванию целиком. */
  function applyAction(s, side, id) {
    var act = byId(id);
    var me = s[side];
    var name = sideName(side);

    if (!act) return { ok: false, text: 'Неизвестное действие.', tone: 'fail' };

    if (act.cost) {
      var lack = missing(me, act.cost);
      if (lack.length) {
        return {
          ok: false,
          text: 'Нельзя: ' + (side === 'you' ? 'вам' : 'сопернику') + ' не хватает — ' + lack.join('; ') + '.',
          tone: 'fail'
        };
      }
    }

    if (id === 'gather') {
      var g = emptyRes();
      var a = pick(s, RESOURCES);
      var b = pick(s, RESOURCES);
      g[a] += 1;
      g[b] += 1;
      addRes(me.res, g);
      return {
        ok: true,
        text: name + ' ' + verb(side, 'собрали', 'собрал') + ' припасы: ' + listRes(g) + '.',
        tone: 'ok'
      };
    }

    if (id === 'risk') {
      var roll = d6(s);
      var risky = name + ' ' + verb(side, 'рискнули', 'рискнул');
      if (roll <= 2) {
        var owned = RESOURCES.filter(function (k) {
          return me.res[k] > 0;
        });
        if (!owned.length) {
          return { ok: true, text: risky + ': выпало ' + roll + ', но терять было нечего.', tone: 'fail' };
        }
        var lost = pick(s, owned);
        me.res[lost] -= 1;
        return {
          ok: true,
          text: risky + ': выпало ' + roll + ', неудача — потеряно: ' + RES_NAME[lost] + ' 1.',
          tone: 'fail'
        };
      }
      me.points += 1;
      var bonus = pick(s, RESOURCES);
      me.res[bonus] += 1;
      return {
        ok: true,
        text: risky + ': выпало ' + roll + ', удача — плюс одно очко и ' + RES_NAME[bonus] + ' 1.',
        tone: 'ok'
      };
    }

    /* Строительство и обмен. */
    var spent = {};
    for (var i = 0; i < RESOURCES.length; i++) {
      var k = RESOURCES[i];
      if (act.cost[k]) spent[k] = -act.cost[k];
    }
    addRes(me.res, spent);

    var gained = { wood: 0, metal: 0, food: 0 };
    if (act.gives) {
      for (var j = 0; j < RESOURCES.length; j++) {
        var kk = RESOURCES[j];
        if (act.gives[kk]) gained[kk] = act.gives[kk];
      }
      addRes(me.res, gained);
    }

    var did = act.done ? act.done[side] : act.label.toLowerCase();
    var text = name + ' ' + did + '. Потрачено: ' + costText(act.cost) + '.';
    if (act.points) {
      me.points += act.points;
      text += ' Очки плюс ' + act.points + ', всего ' + me.points + ' из ' + WIN_POINTS + '.';
    } else {
      text += ' Получено: ' + resText(gained) + '.';
    }

    return { ok: true, text: text, tone: 'ok' };
  }

  function affordable(who, act) {
    return !act.cost || missing(who, act.cost).length === 0;
  }

  /* Простая политика: сначала верстак, потом хижина, иначе сбор.
     Сторона указывается явно — иначе автопрогон легко считает чужие ресурсы. */
  function chooseFor(s, side) {
    side = side === 'you' ? 'you' : 'bot';
    var order = ['bench', 'hut', 'gather'];
    for (var i = 0; i < order.length; i++) {
      var act = byId(order[i]);
      if (affordable(s[side], act)) return act.id;
    }
    return 'gather';
  }

  function botChoose(s) {
    return chooseFor(s, 'bot');
  }

  /* Ход игрока. Меняет фазу на 'bot' или 'over'. */
  function playerAct(s, id) {
    if (s.phase !== 'you') {
      return { ok: false, text: 'Сейчас не ваш ход.', tone: 'fail' };
    }
    var r = applyAction(s, 'you', id);
    if (!r.ok) return r;
    s.moves++;
    if (checkWin(s)) {
      r.text += s.winner === 'you' ? ' Партия окончена: вы победили.' : ' Партия окончена: победил соперник.';
      r.win = true;
      return r;
    }
    s.phase = 'bot';
    return r;
  }

  /* Ход соперника. Возвращает в фазу 'you' и увеличивает раунд. */
  function botAct(s) {
    if (s.phase !== 'bot') {
      return { ok: false, text: 'Соперник сейчас не ходит.', tone: 'fail' };
    }
    var r = applyAction(s, 'bot', botChoose(s));
    s.moves++;
    if (checkWin(s)) {
      r.text += s.winner === 'bot' ? ' Партия окончена: победил соперник.' : ' Партия окончена: вы победили.';
      r.win = true;
      return r;
    }
    s.phase = 'you';
    s.round++;
    return r;
  }

  function turnText(s) {
    if (s.phase === 'over') {
      return s.winner === 'you' ? 'Партия окончена, вы победили.' : 'Партия окончена, победил соперник.';
    }
    if (s.phase === 'bot') return 'Ход соперника.';
    return 'Ваш ход. Раунд ' + s.round + '.';
  }

  function statusText(s) {
    var parts = [];
    parts.push(turnText(s));
    parts.push('Очки: вы ' + s.you.points + ', соперник ' + s.bot.points + ', до победы ' + WIN_POINTS + '.');
    parts.push('Ваши ресурсы: ' + resText(s.you.res) + '.');
    parts.push('Ресурсы соперника: ' + resText(s.bot.res) + '.');
    var avail = [];
    for (var i = 0; i < ACTIONS.length; i++) {
      var a = ACTIONS[i];
      avail.push(i + 1 + ' — ' + a.label.toLowerCase() + (affordable(s.you, a) ? '' : ' (недоступно)'));
    }
    parts.push('Действия: ' + avail.join('; ') + '.');
    parts.push('Номер партии ' + s.seed + '.');
    return parts.join(' ');
  }

  function actionLabel(i) {
    var a = ACTIONS[i];
    if (!a) return null;
    var t = i + 1 + ' — ' + a.label;
    if (a.cost) t += ' (' + costText(a.cost) + ')';
    return t;
  }

  return {
    RESOURCES: RESOURCES,
    RES_NAME: RES_NAME,
    WIN_POINTS: WIN_POINTS,
    ACTIONS: ACTIONS,
    newGame: newGame,
    playerAct: playerAct,
    botAct: botAct,
    botChoose: botChoose,
    chooseFor: chooseFor,
    affordable: affordable,
    statusText: statusText,
    turnText: turnText,
    resText: resText,
    actionLabel: actionLabel,
    byId: byId
  };
});
