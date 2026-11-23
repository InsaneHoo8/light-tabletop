/* Интерфейс «Арены»: озвучивание, выбор цели в два шага, ход ботов по Пробелу. */
(function () {
  'use strict';

  var E = window.ArenaEngine;
  var D = window.GameData;
  if (!E || !D) return;

  var HUMAN = 0;
  var FS_STEPS = ['18px', '21px', '24px', '27px', '31px'];
  var STORE_KEY = 'arena-v1';

  var el = {
    announce: document.getElementById('announce'),
    actions: document.getElementById('actions'),
    options: document.getElementById('options'),
    turn: document.getElementById('turn-info'),
    gate: document.getElementById('gate-hint'),
    log: document.getElementById('log'),
    tbody: document.getElementById('table-body'),
    draftSection: document.getElementById('draft-section'),
    draftList: document.getElementById('draft-list'),
    draftStatus: document.getElementById('draft-status'),
    startRadios: document.querySelectorAll('input[name="startmode"]'),
    mentalRadios: document.querySelectorAll('input[name="mental"]'),
    exchangeRadios: document.querySelectorAll('input[name="exchange"]'),
    optDraft: document.getElementById('opt-draft'),
    optSound: document.getElementById('opt-sound'),
    optTts: document.getElementById('opt-tts'),
    fsUp: document.getElementById('fs-up'),
    fsDown: document.getElementById('fs-down'),
    helpHeading: document.getElementById('help-h')
  };

  var s = null;
  var pending = null;
  var lastText = '';
  var undoSnap = null;
  var settings = { startmode: 'position', mental: 4, exchangeGives: 'rule', draft: false, sound: false, tts: false, fs: 1 };
  var audioCtx = null;

  var EXCHANGE_NAMES = {
    rule: 'по правилу карты',
    mana: 'всё в энергию',
    hp: 'всё в здоровье'
  };

  var START_NAMES = {
    none: 'Без стартовых карт',
    equal: 'Всем по одной',
    position: 'Первый без карт, последний с двумя'
  };

  /* ---------- настройки ---------- */

  function loadSettings() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      var o = JSON.parse(raw);
      if (typeof o.startmode === 'string' && START_NAMES[o.startmode]) settings.startmode = o.startmode;
      if (o.mental === 0 || o.mental === 3 || o.mental === 4) settings.mental = o.mental;
      if (o.exchangeGives === 'mana' || o.exchangeGives === 'hp' || o.exchangeGives === 'rule') settings.exchangeGives = o.exchangeGives;
      if (typeof o.draft === 'boolean') settings.draft = o.draft;
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
    for (var i = 0; i < el.startRadios.length; i++) {
      el.startRadios[i].checked = el.startRadios[i].value === settings.startmode;
    }
    for (var m = 0; m < el.mentalRadios.length; m++) {
      el.mentalRadios[m].checked = Number(el.mentalRadios[m].value) === settings.mental;
    }
    for (var x = 0; x < el.exchangeRadios.length; x++) {
      el.exchangeRadios[x].checked = el.exchangeRadios[x].value === settings.exchangeGives;
    }
    el.optDraft.checked = settings.draft;
    el.optSound.checked = settings.sound;
    el.optTts.checked = settings.tts;
    document.documentElement.style.fontSize = FS_STEPS[settings.fs];
  }

  /* ---------- звук и речь ---------- */

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
      tone(560, 0, 0.08, 0.06);
    } else if (kind === 'fail') {
      tone(200, 0, 0.16, 0.07, 'triangle');
      tone(150, 0.17, 0.18, 0.06, 'triangle');
    } else if (kind === 'die') {
      tone(300, 0, 0.12, 0.08, 'triangle');
      tone(200, 0.13, 0.14, 0.08, 'triangle');
      tone(120, 0.28, 0.22, 0.08, 'triangle');
    } else if (kind === 'win') {
      tone(523, 0, 0.1, 0.07);
      tone(659, 0.12, 0.1, 0.07);
      tone(784, 0.24, 0.18, 0.07);
    }
  }

  function speak(text) {
    if (!settings.tts || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = 'ru-RU';
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }

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
    tag.textContent = (s ? 'К' + s.round + ': ' : '');
    li.appendChild(tag);
    li.appendChild(document.createTextNode(text));
    el.log.appendChild(li);
    while (el.log.children.length > 300) el.log.removeChild(el.log.firstChild);
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
    var body = '';
    el.tbody.textContent = '';
    for (var i = 0; i < s.players.length; i++) {
      var p = s.players[i];
      var tr = document.createElement('tr');
      if (!p.alive) tr.className = 'dead';
      if (i === s.turn && s.phase !== 'over') tr.className = tr.className ? tr.className + ' current' : 'current';
      var cells = [
        p.name + (i === HUMAN ? ' (вы)' : ''),
        D.WORLDS[p.world] || p.world,
        D.ARCHETYPES[p.archetype] || '',
        p.hp + ' из ' + p.maxHp,
        String(p.mental),
        String(p.mana),
        String(p.hand.length)
      ];
      for (var c = 0; c < cells.length; c++) {
        var cell = document.createElement(c === 0 ? 'th' : 'td');
        if (c === 0) cell.setAttribute('scope', 'row');
        cell.textContent = cells[c];
        tr.appendChild(cell);
      }
      el.tbody.appendChild(tr);
    }

    if (s.phase === 'over') {
      el.turn.textContent = 'Бой окончен.';
    } else if (s.turn === HUMAN) {
      el.turn.textContent = 'Ваш ход. Круг ' + s.round + '.';
    } else {
      el.turn.textContent = 'Ход: ' + s.players[s.turn].name + '.';
    }

    if (s.phase === 'over') el.gate.textContent = 'Новый бой — клавиша N.';
    else if (s.turn !== HUMAN) el.gate.textContent = 'Пробел — ход ' + s.players[s.turn].gen + '.';
    else el.gate.textContent = '';

    if (typeof renderDraft === 'function') renderDraft();
  }

  function renderOptions() {
    el.options.textContent = '';
    if (!pending) return;
    for (var i = 0; i < pending.options.length; i++) {
      (function (idx) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-keyshortcuts', String(idx + 1));
        b.textContent = idx + 1 + ' — ' + pending.options[idx].label;
        b.addEventListener('click', function () {
          chooseOption(idx);
        });
        el.options.appendChild(b);
      })(i);
    }
  }

  function after() {
    if (!s) return '';
    if (s.phase === 'over') {
      return s.winner === null ? 'Все выбыли. Новый бой — N.' : 'Победил ' + s.players[s.winner].name + '. Новый бой — N.';
    }
    if (s.turn === HUMAN) return 'Ваш ход, круг ' + s.round + '.';
    return 'Следующий — ' + s.players[s.turn].name + '. Пробел.';
  }

  function focusFirst() {
    var b = el.actions.querySelector('button');
    if (b) b.focus();
  }

  /* ---------- ход ---------- */

  function askStep(actionId, picks, step) {
    var opts = step.options.map(function (o) {
      return { label: o.label, value: o.index };
    });
    if (!opts.length) {
      perform(actionId, picks);
      return;
    }
    pending = { actionId: actionId, picks: picks, field: step.kind, options: opts };
    renderOptions();
    announce(step.question + ' ' + opts.map(function (o, i) { return i + 1 + ' — ' + o.label; }).join('. ') + '.');
  }

  /* ---------- драфт ---------- */

  var draftButtons = [];
  var draftIdx = 0;

  function renderDraft() {
    el.draftList.textContent = '';
    draftButtons = [];
    if (!s || (s.phase !== 'draft' && s.phase !== 'pick')) {
      el.draftSection.hidden = true;
      return;
    }
    el.draftSection.hidden = false;
    var isPick = s.phase === 'pick';
    var picker = isPick ? s.players[s.pickOrder[s.pickIndex]] : null;
    var opts = isPick
      ? E.pickOptions(s).map(function (a) {
          return a.id;
        })
      : E.draftOptions(s);
    for (var i = 0; i < opts.length; i++) {
      (function (abId, num) {
        var ab = D.abilityById(abId);
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'draft-card';
        b.setAttribute('data-id', abId);
        b.textContent = num + '. ' + ab.name + ' — ' + ab.cost + ' энергии: ' + (ab.desc || '');
        b.addEventListener('click', function () {
          if (isPick) pickHand(abId);
          else pickDraft(abId);
        });
        el.draftList.appendChild(b);
        draftButtons.push(b);
      })(opts[i], i + 1);
    }
    if (isPick) {
      el.draftStatus.textContent =
        'Перед боем наберите способности в руку. Лимит ' + picker.handLimit + ', выбрано ' + picker.abilities.length + '. В вашем пуле ' + opts.length + ' карт.';
    } else {
      el.draftStatus.textContent = 'В пуле ' + opts.length + ' карт. Ваш выбор.';
    }
  }

  function focusDraft(i) {
    if (!draftButtons.length) return;
    draftIdx = Math.max(0, Math.min(draftButtons.length - 1, i));
    draftButtons[draftIdx].focus();
  }

  function pickDraft(abId) {
    if (!s || s.phase !== 'draft') return;
    var r = E.draftPick(s, abId);
    if (!r.ok) {
      announce(r.text);
      return;
    }
    var parts = [r.text];
    var botTexts = E.runBotsDraft(s, HUMAN);
    if (botTexts.length) parts.push('Боты — ' + botTexts.join(' '));
    draftIdx = 0;
    render();
    if (s.phase === 'draft') {
      renderDraft();
      announce(parts.join(' ') + ' Ваш выбор из ' + E.draftOptions(s).length + ' карт.');
      focusDraft(0);
    } else {
      renderDraft();
      announce(parts.join(' ') + ' Драфт окончен. ' + E.statusText(s));
      focusFirst();
    }
  }
  function pickHand(abId) {
    if (!s || s.phase !== 'pick') return;
    var r = E.pickAbility(s, abId);
    if (!r.ok) {
      announce(r.text);
      return;
    }
    var parts = [r.text];
    var botTexts = E.runBotsPick(s, HUMAN);
    if (botTexts.length) parts.push('Боты — ' + botTexts.join(' '));
    draftIdx = 0;
    render();
    if (s.phase === 'pick') {
      renderDraft();
      var pl = s.players[s.pickOrder[s.pickIndex]];
      announce(parts.join(' ') + ' Осталось выбрать ' + (pl.handLimit - pl.abilities.length) + '.');
      focusDraft(0);
    } else {
      renderDraft();
      announce(parts.join(' ') + ' Рука собрана. ' + E.statusText(s));
      focusFirst();
    }
  }

  function startAction(actionId) {
    if (!s) return;
    if (s.phase === 'draft') {
      announce('Сначала драфт: выберите способность стрелками и Enter.');
      return;
    }
    if (s.phase === 'pick') {
      announce('Сначала соберите руку: выберите способность стрелками и Enter.');
      return;
    }
    if (s.phase === 'over') {
      announce('Бой окончен. Новый — клавиша N.');
      return;
    }
    if (s.turn !== HUMAN) {
      announce('Сейчас ход ' + s.players[s.turn].gen + '. Пробел.');
      return;
    }
    pending = null;
    renderOptions();
    var step = E.nextStep(s, actionId, {});
    if (!step) {
      perform(actionId, {});
      return;
    }
    askStep(actionId, {}, step);
  }

  function chooseOption(n) {
    if (!pending) return;
    var o = pending.options[n];
    if (!o) {
      announce('Нет варианта ' + (n + 1) + '.');
      return;
    }
    var picks = {};
    for (var k in pending.picks) if (Object.prototype.hasOwnProperty.call(pending.picks, k)) picks[k] = pending.picks[k];
    if (pending.field === 'mode') picks.mode = o.value;
    else if (pending.field === 'player2') picks.target2 = o.value;
    else if (pending.field === 'player') picks.target = o.value;
    else if (pending.field === 'ability') picks.ability = o.value;
    else picks.artifact = o.value;

    var actionId = pending.actionId;
    var step = E.nextStep(s, actionId, picks);
    if (step) {
      askStep(actionId, picks, step);
      return;
    }
    pending = null;
    renderOptions();
    perform(actionId, picks);
  }

  function perform(actionId, picks) {
    var snap = { state: JSON.parse(JSON.stringify(s)), logLen: el.log.children.length };
    var r = E.apply(s, actionId, picks);
    if (!r.ok) {
      announce('Нельзя. ' + r.text);
      sfx('fail');
      render();
      return;
    }
    undoSnap = snap;
    announce(r.text + ' ' + after());
    sfx(/выбывает|окончена/.test(r.text) ? 'die' : 'ok');
    render();
    if (s.phase === 'over') sfx('win');
  }

  function stepBot() {
    if (!s) return;
    if (s.phase === 'over') {
      announce('Бой окончен. Новый — клавиша N.');
      return;
    }
    if (s.turn === HUMAN) {
      announce('Сейчас ваш ход.');
      return;
    }
    var mv = E.botMove(s, 0.8);
    var r = E.apply(s, mv.action, mv.picks);
    if (!r.ok) {
      announce('Ошибка хода бота: ' + r.text);
      return;
    }
    announce(r.text + ' ' + after());
    sfx(/выбывает|окончена/.test(r.text) ? 'die' : 'bot');
    render();
    if (s.phase === 'over') sfx('win');
  }

  function undoMove() {
    if (!undoSnap) {
      announce('Отменять нечего.');
      sfx('fail');
      return;
    }
    s = undoSnap.state;
    while (el.log.children.length > undoSnap.logLen) el.log.removeChild(el.log.lastChild);
    undoSnap = null;
    pending = null;
    renderOptions();
    render();
    announce('Ход отменён. ' + after());
  }

  function newGame(opts) {
    var cfg = { count: 4, startHandMode: settings.startmode };
    if (opts) {
      for (var k in opts) if (Object.prototype.hasOwnProperty.call(opts, k)) cfg[k] = opts[k];
    }
    cfg.mentalFloor = settings.mental;
    cfg.exchangeGives = settings.exchangeGives;
    cfg.draft = settings.draft;
    s = E.newGame(cfg);
    undoSnap = null;
    pending = null;
    renderOptions();
    el.log.textContent = '';
    render();
    var meP = s.players[HUMAN];
    var intro =
      'Бой ' + s.seed + '. Ваш боец — ' + meP.name + '. Здоровье ' + meP.hp + ', урон ' + meP.dmg +
      ', энергия ' + meP.mana + '.';
    if (s.phase === 'draft') {
      var botTexts = E.runBotsDraft(s, HUMAN);
      if (botTexts.length) intro += ' Боты — ' + botTexts.join(' ');
      renderDraft();
      announce(intro + ' Драфт: выберите способность. Стрелки — листать, Enter — взять.', { force: true });
      focusDraft(0);
      return;
    }
    announce(intro + ' ' + after(), { force: true });
    focusFirst();
  }

  function toggleSound() {
    settings.sound = !settings.sound;
    el.optDraft.checked = settings.draft;
    el.optSound.checked = settings.sound;
    saveSettings();
    announce(settings.sound ? 'Звук включён.' : 'Звук выключен.', { force: true });
    if (settings.sound) sfx('ok');
  }

  function changeFs(d) {
    settings.fs = Math.max(0, Math.min(FS_STEPS.length - 1, settings.fs + d));
    document.documentElement.style.fontSize = FS_STEPS[settings.fs];
    saveSettings();
    announce('Размер текста: ' + settings.fs + ' из ' + (FS_STEPS.length - 1) + '.', { force: true });
  }

  /* ---------- клавиши ---------- */

  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    var code = e.code || '';
    var isField = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName || '');

    if (s && s.phase === 'draft') {
      if (code === 'ArrowDown') {
        e.preventDefault();
        focusDraft(draftIdx + 1);
        return;
      }
      if (code === 'ArrowUp') {
        e.preventDefault();
        focusDraft(draftIdx - 1);
        return;
      }
      var dm = /^(?:Digit|Numpad)([1-9])$/.exec(code);
      if (dm) {
        e.preventDefault();
        var pickBtn = draftButtons[parseInt(dm[1], 10) - 1];
        if (pickBtn) pickBtn.click();
        return;
      }
      if (code === 'KeyN') {
        e.preventDefault();
        newGame();
        return;
      }
      return;
    }

    if (code === 'Space' || code === 'Spacebar') {
      if (isField) return;
      e.preventDefault();
      if (pending) {
        announce('Сначала выберите вариант цифрой или отмените Escape.');
        return;
      }
      stepBot();
      return;
    }

    var m = /^(?:Digit|Numpad)([1-9])$/.exec(code);
    if (m) {
      var n = parseInt(m[1], 10) - 1;
      e.preventDefault();
      if (pending) chooseOption(n);
      else if (E.ACTIONS[n]) startAction(E.ACTIONS[n].id);
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
        if (pending) {
          pending = null;
          renderOptions();
          announce('Выбор отменён. ' + after());
        } else {
          focusFirst();
        }
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
      b.setAttribute('data-id', a.id);
      b.setAttribute('aria-keyshortcuts', String(i + 1));
      b.textContent = i + 1 + ' — ' + a.label;
      b.addEventListener('click', function () {
        startAction(a.id);
      });
      el.actions.appendChild(b);
    });
  }

  function wireSettings() {
    for (var i = 0; i < el.startRadios.length; i++) {
      (function (radio) {
        radio.addEventListener('change', function () {
          if (!radio.checked) return;
          settings.startmode = radio.value;
          saveSettings();
          announce('Стартовая раздача: ' + START_NAMES[settings.startmode] + '. Применится в новом бою, клавиша N.', {
            force: true
          });
        });
      })(el.startRadios[i]);
    }
    for (var m2 = 0; m2 < el.mentalRadios.length; m2++) {
      (function (radio) {
        radio.addEventListener('change', function () {
          if (!radio.checked) return;
          settings.mental = Number(radio.value);
          saveSettings();
          var word =
            settings.mental === 0
              ? 'как в черновиках'
              : settings.mental === 3
                ? 'не меньше трёх'
                : 'не меньше четырёх';
          announce('Менталка: ' + word + '. Применится в новом бою, клавиша N.', { force: true });
        });
      })(el.mentalRadios[m2]);
    }
    for (var x2 = 0; x2 < el.exchangeRadios.length; x2++) {
      (function (radio) {
        radio.addEventListener('change', function () {
          if (!radio.checked) return;
          settings.exchangeGives = radio.value;
          saveSettings();
          announce(
            'Обмен артефакта: ' + EXCHANGE_NAMES[radio.value] + '. Применится в новом бою, клавиша N.',
            { force: true }
          );
        });
      })(el.exchangeRadios[x2]);
    }
    el.optDraft.addEventListener('change', function () {
      settings.draft = el.optDraft.checked;
      saveSettings();
      announce(settings.draft ? 'Драфт включён. Применится в новом бою, клавиша N.' : 'Драфт выключен, способности личные. Применится в новом бою.', { force: true });
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
    newGame();
  }

  window.__arena = {
    state: function () {
      return s;
    },
    status: function () {
      return s ? E.statusText(s) : '';
    },
    announceText: function () {
      return el.announce.textContent;
    },
    logText: function () {
      return el.log.textContent;
    },
    start: startAction,
    choose: chooseOption,
    bot: stepBot,
    undo: undoMove,
    newGame: newGame,
    setDraft: function (v) {
      settings.draft = !!v;
      el.optDraft.checked = settings.draft;
      saveSettings();
      newGame();
    },
    pick: function (id) { return E.pickAbility(s, id); },
    pickOptions: function () { return E.pickOptions(s); },
    runBotsPick: function () { return E.runBotsPick(s, HUMAN); },
    autoPick: function () {
      var guard = 0;
      while (s.phase === 'pick' && guard++ < 40) {
        E.runBotsPick(s, HUMAN);
        if (s.phase !== 'pick') break;
        var opts = E.pickOptions(s);
        if (!opts.length) break;
        var r = E.pickAbility(s, opts[0].id);
        if (!r.ok) break;
      }
      E.runBotsPick(s, HUMAN);
      render();
      renderDraft();
      return s.phase;
    },
    autoDraft: function () {
      if (!s || s.phase !== 'draft') return;
      E.runBotsDraft(s, -1);
      renderDraft();
      render();
      if (s.phase === 'main') {
        announce('Драфт окончен. ' + E.statusText(s), { force: true });
        focusFirst();
      }
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
