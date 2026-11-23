/* Слой интерфейса: озвучивание, клавиши, журнал.
   Вся логика — в engine.js. Здесь только «как это звучит». */
(function () {
  'use strict';

  var E = window.GameEngine;
  if (!E) return;

  var FS_STEPS = ['18px', '21px', '24px', '27px', '31px'];
  var STORE_KEY = 'quiet-harbor-demo-v1';

  var el = {
    announce: document.getElementById('announce'),
    actions: document.getElementById('actions'),
    turn: document.getElementById('turn-info'),
    gate: document.getElementById('gate-hint'),
    log: document.getElementById('log'),
    youPoints: document.getElementById('you-points'),
    youWood: document.getElementById('you-wood'),
    youMetal: document.getElementById('you-metal'),
    youFood: document.getElementById('you-food'),
    botPoints: document.getElementById('bot-points'),
    botWood: document.getElementById('bot-wood'),
    botMetal: document.getElementById('bot-metal'),
    botFood: document.getElementById('bot-food'),
    optGate: document.getElementById('opt-gate'),
    optSound: document.getElementById('opt-sound'),
    optTts: document.getElementById('opt-tts'),
    fsUp: document.getElementById('fs-up'),
    fsDown: document.getElementById('fs-down'),
    helpHeading: document.getElementById('help-h')
  };

  var s = null;
  var undoStack = [];
  var lastText = '';
  var settings = { gate: true, sound: false, tts: false, fs: 1 };
  var audioCtx = null;
  var botTimer = null;

  /* ---------- настройки ---------- */

  function loadSettings() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      var o = JSON.parse(raw);
      if (typeof o.gate === 'boolean') settings.gate = o.gate;
      if (typeof o.sound === 'boolean') settings.sound = o.sound;
      if (typeof o.tts === 'boolean') settings.tts = o.tts;
      if (typeof o.fs === 'number') settings.fs = Math.max(0, Math.min(FS_STEPS.length - 1, o.fs | 0));
    } catch (e) {}
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(settings));
    } catch (e) {}
  }

  function applySettings() {
    el.optGate.checked = settings.gate;
    el.optSound.checked = settings.sound;
    el.optTts.checked = settings.tts;
    document.documentElement.style.fontSize = FS_STEPS[settings.fs];
  }

  /* ---------- звук ---------- */

  function tone(freq, delay, dur, vol, type) {
    if (!settings.sound) return;
    try {
      if (!audioCtx) {
        var Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        audioCtx = new Ctx();
      }
      if (audioCtx.state === 'suspended') audioCtx.resume();
      var t0 = audioCtx.currentTime + delay;
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.03);
    } catch (e) {}
  }

  function sfx(kind) {
    if (!settings.sound) return;
    if (kind === 'ok') {
      tone(620, 0, 0.09, 0.07);
      tone(880, 0.1, 0.12, 0.07);
    } else if (kind === 'fail') {
      tone(210, 0, 0.18, 0.08, 'triangle');
      tone(165, 0.19, 0.2, 0.07, 'triangle');
    } else if (kind === 'bot') {
      tone(440, 0, 0.07, 0.05);
    } else if (kind === 'win') {
      tone(523, 0, 0.1, 0.08);
      tone(659, 0.12, 0.1, 0.08);
      tone(784, 0.24, 0.18, 0.08);
    }
  }

  /* ---------- озвучивание ---------- */

  function speak(text) {
    if (!settings.tts || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = 'ru-RU';
      u.rate = 1;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }

  /* Одинаковый текст не порождает изменения в live-области, поэтому при
     повторе (клавиша R) элемент перезаписывается в два шага. */
  function setLive(text) {
    if (el.announce.textContent === text) {
      el.announce.textContent = '';
      setTimeout(function () {
        el.announce.textContent = text;
      }, 60);
    } else {
      el.announce.textContent = text;
    }
  }

  function addLog(text) {
    var li = document.createElement('li');
    var tag = document.createElement('span');
    tag.className = 'log-round';
    tag.textContent = (s ? 'Р' + s.round + ':' : '') + ' ';
    li.appendChild(tag);
    li.appendChild(document.createTextNode(text));
    el.log.appendChild(li);
    while (el.log.children.length > 200) el.log.removeChild(el.log.firstChild);
  }

  function announce(text, opts) {
    opts = opts || {};
    if (!text) return;
    lastText = text;
    setLive(text);
    addLog(text);
    speak(text);
  }

  /* ---------- отрисовка ---------- */

  function render() {
    if (!s) return;
    el.youPoints.textContent = s.you.points;
    el.youWood.textContent = s.you.res.wood;
    el.youMetal.textContent = s.you.res.metal;
    el.youFood.textContent = s.you.res.food;
    el.botPoints.textContent = s.bot.points;
    el.botWood.textContent = s.bot.res.wood;
    el.botMetal.textContent = s.bot.res.metal;
    el.botFood.textContent = s.bot.res.food;
    el.turn.textContent = E.turnText(s) + ' Очки: вы ' + s.you.points + ', соперник ' + s.bot.points + '.';
    if (s.phase !== 'bot') el.gate.textContent = '';
  }

  function afterText() {
    if (!s) return '';
    if (s.phase === 'over') return 'Новая партия — клавиша N.';
    if (s.phase === 'bot') return settings.gate ? 'Нажмите Пробел, чтобы соперник сходил.' : 'Соперник ходит.';
    // Остаток ресурсов произносится в момент решения, а не только по клавише S.
    return 'Ваш ход, раунд ' + s.round + '. У вас: ' + E.resText(s.you.res) + '.';
  }

  function focusFirst() {
    var b = el.actions.querySelector('button');
    if (b) b.focus();
  }

  /* ---------- ход ---------- */

  function doAction(id) {
    if (!s) return;
    if (s.phase !== 'you') {
      announce('Сейчас не ваш ход. ' + afterText());
      sfx('fail');
      return;
    }
    var snapshot = {
      state: JSON.parse(JSON.stringify(s)),
      logLen: el.log.children.length
    };
    var r = E.playerAct(s, id);
    if (!r.ok) {
      announce(r.text);
      sfx('fail');
      render();
      return;
    }
    undoStack.push(snapshot);
    if (undoStack.length > 20) undoStack.shift();
    announce(r.text + ' ' + afterText());
    sfx(r.tone);
    render();
    if (r.win) {
      sfx('win');
      return;
    }
    if (settings.gate) {
      el.gate.textContent = 'Соперник готов ходить. Пробел — дать ход.';
    } else {
      scheduleBot();
    }
  }

  function scheduleBot() {
    if (botTimer) clearTimeout(botTimer);
    botTimer = setTimeout(function () {
      botTimer = null;
      runBot();
    }, 900);
  }

  function runBot() {
    if (!s || s.phase !== 'bot') return;
    if (botTimer) {
      clearTimeout(botTimer);
      botTimer = null;
    }
    var r = E.botAct(s);
    sfx(r.tone === 'ok' ? 'bot' : 'fail');
    announce(r.text + ' ' + afterText());
    render();
    if (r.win) sfx('win');
  }

  function undoMove() {
    if (!undoStack.length) {
      announce('Отменять нечего.');
      sfx('fail');
      return;
    }
    var snap = undoStack.pop();
    s = snap.state;
    while (el.log.children.length > snap.logLen) el.log.removeChild(el.log.lastChild);
    if (botTimer) {
      clearTimeout(botTimer);
      botTimer = null;
    }
    announce(
      'Ход отменён. ' + E.turnText(s) + ' Очки: вы ' + s.you.points + ', соперник ' + s.bot.points + '.'
    );
    sfx('fail');
    render();
  }

  function newGame(seed) {
    s = E.newGame(seed);
    undoStack = [];
    if (botTimer) {
      clearTimeout(botTimer);
      botTimer = null;
    }
    el.log.textContent = '';
    el.gate.textContent = '';
    render();
    announce(
      'Партия ' + s.seed + '. ' + E.turnText(s) + ' Ресурсов нет. Цифры 1–5 — действия, S — состояние.',
      { force: true }
    );
    focusFirst();
  }

  function toggleSound() {
    settings.sound = !settings.sound;
    el.optSound.checked = settings.sound;
    saveSettings();
    announce(settings.sound ? 'Звуковые сигналы включены.' : 'Звуковые сигналы выключены.', { force: true });
    if (settings.sound) sfx('ok');
  }

  function changeFs(delta) {
    settings.fs = Math.max(0, Math.min(FS_STEPS.length - 1, settings.fs + delta));
    document.documentElement.style.fontSize = FS_STEPS[settings.fs];
    saveSettings();
    announce('Размер текста: ' + settings.fs + ' из ' + (FS_STEPS.length - 1) + '.', { force: true });
  }

  /* ---------- клавиши ---------- */

  /* Привязка по e.code — по физической клавише, чтобы работало на русской
     раскладке, где те же клавиши дают Ы, Р, К, Г, Т, Ь. */
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    var code = e.code || '';
    var target = e.target || {};
    var isField = /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName || '');

    if (code === 'Space' || code === 'Spacebar') {
      if (isField) return;
      if (s && s.phase === 'bot' && settings.gate) {
        e.preventDefault();
        runBot();
      }
      return;
    }

    var m = /^(?:Digit|Numpad)([1-9])$/.exec(code);
    if (m) {
      var act = E.ACTIONS[parseInt(m[1], 10) - 1];
      if (act) {
        e.preventDefault();
        doAction(act.id);
      }
      return;
    }

    switch (code) {
      case 'KeyS':
        e.preventDefault();
        if (s) announce(E.statusText(s), { force: true });
        break;
      case 'KeyR':
        e.preventDefault();
        announce(lastText, { force: true });
        break;
      case 'KeyU':
        e.preventDefault();
        undoMove();
        break;
      case 'KeyN':
        e.preventDefault();
        newGame();
        break;
      case 'KeyM':
        e.preventDefault();
        toggleSound();
        break;
      case 'KeyH':
        e.preventDefault();
        if (el.helpHeading) el.helpHeading.focus();
        break;
      case 'Escape':
        e.preventDefault();
        focusFirst();
        break;
      case 'Equal':
      case 'NumpadAdd':
        e.preventDefault();
        changeFs(1);
        break;
      case 'Minus':
      case 'NumpadSubtract':
        e.preventDefault();
        changeFs(-1);
        break;
      default:
        break;
    }
  });

  /* ---------- сборка ---------- */

  function buildActions() {
    E.ACTIONS.forEach(function (a, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'act';
      b.setAttribute('data-id', a.id);
      b.setAttribute('aria-keyshortcuts', String(i + 1));
      b.textContent = E.actionLabel(i);
      b.addEventListener('click', function () {
        doAction(a.id);
      });
      el.actions.appendChild(b);
    });
  }

  function wireSettings() {
    el.optGate.addEventListener('change', function () {
      settings.gate = el.optGate.checked;
      saveSettings();
      if (settings.gate && s && s.phase === 'bot') {
        el.gate.textContent = 'Соперник готов ходить. Пробел — дать ход.';
        announce('Ожидание Пробела включено. Соперник ждёт.', { force: true });
      } else if (s && s.phase === 'bot') {
        announce('Ожидание выключено. Соперник ходит сразу.', { force: true });
        scheduleBot();
      }
    });
    el.optSound.addEventListener('change', function () {
      settings.sound = el.optSound.checked;
      saveSettings();
      if (settings.sound) sfx('ok');
    });
    el.optTts.addEventListener('change', function () {
      settings.tts = el.optTts.checked;
      saveSettings();
      if (settings.tts) speak('Озвучивание через браузер включено.');
    });
    el.fsUp.addEventListener('click', function () {
      changeFs(1);
    });
    el.fsDown.addEventListener('click', function () {
      changeFs(-1);
    });
  }

  function init() {
    loadSettings();
    applySettings();
    buildActions();
    wireSettings();
    s = E.newGame();
    render();
    focusFirst();
    announce(
      'Демо настольной игры. Партия ' + s.seed + '. Ваш ход, раунд 1. Ресурсов нет. ' +
        'Цифры 1–5 — действия. S — состояние. H — помощь.',
      { force: true }
    );
  }

  /* Отладочный доступ для автоматической проверки доступности. */
  window.__demo = {
    state: function () {
      return s;
    },
    act: doAction,
    bot: runBot,
    undo: undoMove,
    newGame: newGame,
    announceText: function () {
      return el.announce.textContent;
    },
    logText: function () {
      return el.log.textContent;
    },
    status: function () {
      return s ? E.statusText(s) : '';
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
