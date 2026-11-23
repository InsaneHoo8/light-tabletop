/* Движок «Войны за Сосиску» по актуальным правилам.
   Способности и артефакты описаны операциями (ops), которые исполняет applyOps. */

var D = require('./cards.js');

var MAX_HAND_ARTIFACTS = 99;

/* ---------- случайность ---------- */

function rand(s) {
  s.rngState = (s.rngState + 0x6d2b79f5) | 0;
  var t = s.rngState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function shuffle(s, arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(rand(s) * (i + 1));
    var tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

/* ---------- поиск карт ---------- */

function charById(id) {
  for (var i = 0; i < D.CHARACTERS.length; i++) if (D.CHARACTERS[i].id === id) return D.CHARACTERS[i];
  return null;
}

function artifactById(id) {
  for (var i = 0; i < D.ARTIFACTS.length; i++) if (D.ARTIFACTS[i].id === id) return D.ARTIFACTS[i];
  return null;
}

function abilityById(id) {
  for (var i = 0; i < D.CHARACTERS.length; i++) {
    var list = D.CHARACTERS[i].abilities;
    for (var j = 0; j < list.length; j++) if (list[j].id === id) return list[j];
  }
  return null;
}

/* ---------- создание партии ---------- */

function newGame(opts) {
  opts = opts || {};
  var count = Math.max(2, Math.min(6, opts.count || 4));
  var seed = opts.seed;
  if (seed === undefined || seed === null || !isFinite(seed)) seed = Math.floor(Math.random() * 900000) + 100000;
  seed = Math.abs(Math.floor(seed)) % 1000000000;

  var s = {
    freeArtifacts: !!opts.freeArtifacts,
    preferExtra: !!opts.preferExtra,
    preferShield: !!opts.preferShield,
    priority: !!opts.priority,
    counterAware: !!opts.counterAware,
    aggression: opts.aggression || 0,
    caution: opts.caution || 0,
    seed: seed,
    rngState: seed | 0,
    round: 1,
    turn: 0,
    phase: 'pick',
    winner: null,
    deck: [],
    oldDiscard: [],
    newDiscard: [],
    recycling: false,
    players: [],
    events: [],
    pickOrder: [],
    pickIndex: 0
  };

  var chars = opts.chars ? opts.chars.map(charById) : shuffle(s, D.CHARACTERS).slice(0, count);
  for (var i = 0; i < count; i++) {
    var ch = chars[i % chars.length];
    s.players.push(makePlayer(i, ch, !!opts.noArtifactLimit));
    if (opts.comboMode) s.players[s.players.length - 1].comboMode = true;
  }

  if (opts.mixed) {
    var styles = ['aggro', 'aggro', 'caution', 'caution'];
    for (var mi = styles.length - 1; mi > 0; mi--) {
      var mj = Math.floor(rand(s) * (mi + 1));
      var tmpS = styles[mi];
      styles[mi] = styles[mj];
      styles[mj] = tmpS;
    }
    for (var si = 0; si < s.players.length; si++) {
      s.players[si].style = styles[si] || 'normal';
    }
  }

  /* заданный набор стилей: 'random' означает случайный стиль в этой партии */
  if (opts.styles) {
    var pool = ['aggro', 'caution', 'normal'];
    for (var psi = 0; psi < s.players.length; psi++) {
      var want = opts.styles[psi] || 'normal';
      if (want === 'random') want = pool[Math.floor(rand(s) * pool.length)];
      s.players[psi].style = want;
    }
  }

  s.deck = shuffle(s, D.ARTIFACTS.map(function (a) { return a.id; }));

  /* сначала все выбирают руку, потом колода артефактов раздаётся */
  var need = s.players.map(function (p) { return p.handLimit; });
  var guard = 0;
  while (need.some(function (n) { return n > 0; }) && guard++ < 100) {
    for (var q = 0; q < count; q++) {
      if (need[q] > 0) {
        s.pickOrder.push(q);
        need[q]--;
      }
    }
  }
  s.pickIndex = 0;
  return s;
}

function makePlayer(idx, ch, noArtifactLimit) {
  return {
    idx: idx,
    charId: ch.id,
    name: ch.name,
    full: ch.full,
    gen: ch.gen,
    acc: ch.acc,
    dat: ch.dat,
    world: ch.world,
    hp: ch.hp,
    maxHp: ch.hp,
    dmg: ch.dmg,
    mental: ch.mental,
    maxMental: ch.mental,
    mana: ch.mana,
    maxMana: ch.mana,
    handLimit: ch.handLimit,
    artifactLimit: noArtifactLimit ? 99 : (ch.artifactLimit || 5),
    hand: [],
    abilities: [],
    pool: ch.abilities.slice(),
    oldDiscard: [],
    newDiscard: [],
    style: 'normal',
    shieldCap: ch.shieldCap || 5,
    shield: 0,
    shieldCards: [],
    passiveUsed: {},
    shieldForever: false,
    shieldPunish: 0,
    shieldAllPunish: 0,
    reduce: 0,
    reduceTurns: 0,
    buff: 0,
    skipNext: 0,
    noAttack: 0,
    noAbilities: 0,
    noArtifacts: 0,
    tax: 0,
    dot: 0,
    weakened: 0,
    weakenTurns: 0,
    buffAll: 0,
    buffTurns: 0,
    forceAttack: 0,
    restrictTarget: null,
    restrictArmed: false,
    blockNext: 0,
    extraActions: 0,
    comboMode: false,
    comboAltarUsed: false,
    comboNeuroUsed: false,
    alive: true
  };
}

/* ---------- выбор руки ---------- */

/* Карта, которую даст обмен на способность прямо сейчас. */
function nextExchangeCard(p) {
  if (p.pool.length > 0) return p.pool[p.pool.length - 1];
  if (p.oldDiscard.length > 0) return p.oldDiscard[p.oldDiscard.length - 1];
  return null;
}

function pickOptions(s) {
  if (s.phase !== 'pick') return [];
  var p = s.players[s.pickOrder[s.pickIndex]];
  return p ? p.pool.slice() : [];
}

function pickOwner(s) {
  return s.phase === 'pick' ? s.pickOrder[s.pickIndex] : -1;
}

function pickAbility(s, abilityId) {
  if (s.phase !== 'pick') return { ok: false, text: 'Выбор уже закончен.' };
  var p = s.players[s.pickOrder[s.pickIndex]];
  if (!p) return { ok: false, text: 'Некому выбирать.' };
  var idx = -1;
  for (var i = 0; i < p.pool.length; i++) if (p.pool[i].id === abilityId) { idx = i; break; }
  if (idx < 0) return { ok: false, text: 'Такой способности нет в вашем пуле.' };
  if (p.abilities.length >= p.handLimit) return { ok: false, text: 'Рука заполнена.' };
  var ab = p.pool.splice(idx, 1)[0];
  p.abilities.push(ab);
  s.pickIndex++;
  if (s.pickIndex >= s.pickOrder.length) {
    s.phase = 'main';
    s.turn = 0;
    dealStartArtifacts(s);
  }
  return { ok: true, text: p.name + ' берёт в руку «' + ab.name + '».' };
}

function dealStartArtifacts(s) {
  for (var i = 0; i < s.players.length; i++) {
    if (s.deck.length) s.players[i].hand.push(s.deck.shift());
  }
}

function abilityOptions(s, p) {
  return p.abilities.map(function (a, i) {
    var cost = a.cost;
    if (a.modes) cost = Math.min.apply(null, a.modes.map(function (m) { return m.cost; }));
    return { index: i, label: a.name, cost: cost, affordable: p.mana >= cost + p.tax };
  });
}

/* ---------- цели ---------- */

function neighbors(s, idx) {
  var out = [];
  for (var i = 1; i < s.players.length; i++) {
    var li = (idx - i + s.players.length) % s.players.length;
    if (s.players[li].alive) { out.push(li); break; }
  }
  for (var j = 1; j < s.players.length; j++) {
    var ri = (idx + j) % s.players.length;
    if (s.players[ri].alive) {
      if (out.indexOf(ri) === -1) out.push(ri);
      break;
    }
  }
  return out;
}

function playerTargets(s, p) {
  var out = [];
  for (var i = 0; i < s.players.length; i++) {
    if (i !== p.idx && s.players[i].alive) out.push({ index: i, label: s.players[i].name });
  }
  return out;
}

/* ---------- урон и щит ---------- */

function damage(s, targetIdx, amount, events, opts) {
  opts = opts || {};
  var t = s.players[targetIdx];
  if (!t || !t.alive || amount <= 0) return 0;

  var dmg = amount;

  /* Григорий: три артефакта в руке — получает на единицу меньше */
  if (t.charId === 'grigori' && t.hand.length >= 3) {
    dmg = Math.max(1, dmg - 1);
  }
  /* Грог: при восьми здоровья и меньше получает на единицу больше */
  if (t.charId === 'grog' && t.hp <= 7) {
    dmg = dmg + 1;
  }

  /* Боря: при недостаче четырёх энергии получает на единицу больше */
  if (t.charId === 'borya') {
    var missBD = Math.max(0, t.maxMana - t.mana);
    if (missBD >= 4) dmg = dmg + 1;
  }

  /* Маг: усиление всех своих эффектов на два хода */
  if (opts && opts.attacker !== undefined && opts.attacker !== null) {
    var atkP = s.players[opts.attacker];
    if (atkP && atkP.buffAll) dmg = dmg + atkP.buffAll;
  }

  /* реакция защищающегося */
  dmg = tryReaction(s, targetIdx, dmg, events, opts);

  if (!opts.pierce && dmg > 0) {
    if (t.shield > 0) {
      var absorbed = Math.min(t.shield, dmg);
      t.shield -= absorbed;
      dmg -= absorbed;
      events.push(t.name + ': щит поглотил ' + absorbed + (t.shield > 0 ? ', осталось ' + t.shield : ', щит разрушен') + '.');
      if (t.shield <= 0 && t.shieldCards.length) {
        t.shieldCards = [];
        events.push('Щит ' + t.gen + ' разрушен, карта уходит в сброс.');
      }
      if (t.shield <= 0 && t.shieldAllPunish) {
        for (var sp = 0; sp < s.players.length; sp++) {
          var psp = s.players[sp];
          if (!psp.alive) continue;
          psp.mana = Math.max(0, psp.mana - t.shieldAllPunish);
        }
        events.push('Щит разрушен: все теряют по ' + t.shieldAllPunish + ' энергии.');
        t.shieldAllPunish = 0;
      }
      if (t.shield <= 0 && t.shieldPunish && opts.attacker !== undefined) {
        s.players[opts.attacker].mana = Math.max(0, s.players[opts.attacker].mana - t.shieldPunish);
        events.push('Щит разрушен: ' + s.players[opts.attacker].name + ' теряет ' + t.shieldPunish + ' энергии.');
        t.shieldPunish = 0;
      }
    }
  }

  if (dmg > 0 && t.reduce > 0) {
    var cut = Math.min(t.reduce, dmg);
    dmg = Math.max(1, dmg - cut);
    events.push('Защита ' + t.gen + ' гасит ' + cut + '.');
  }

  if (dmg <= 0) return 0;

  t.hp -= dmg;
  events.push(t.name + ' получает ' + dmg + '. Осталось ' + Math.max(0, t.hp) + ' из ' + t.maxHp + '.');

  /* контракт: бьющий лечится */
  if (opts.attacker !== undefined && t.marked) {
    var healer = s.players[opts.attacker];
    var before = healer.hp;
    healer.hp = Math.min(healer.maxHp, healer.hp + t.marked);
    if (healer.hp > before) events.push('Контракт: ' + healer.name + ' восстанавливает ' + (healer.hp - before) + '.');
  }

  if (t.hp <= 0) {
    t.hp = 0;
    t.alive = false;
    events.push(t.name + ' выбывает.');
  }
  return dmg;
}

/* ---------- реакции ---------- */

function tryReaction(s, victimIdx, amount, events, opts) {
  var v = s.players[victimIdx];
  for (var i = 0; i < v.abilities.length; i++) {
    var ab = v.abilities[i];
    if (!ab.reaction) continue;
    if (v.mana < ab.cost) continue;

    if (ab.id === 'parashyut' && v.hp > 10) continue;
    if (ab.id === 'pyanaya' && opts.directed === false) continue;
    if (ab.id === 'parirovanie' && opts.directed === false) continue;

    v.mana -= ab.cost;
    v.abilities.splice(i, 1);
    pileAfterUse(s, v, ab);
    events.push(v.name + ' играет реакцию «' + ab.name + '».');

    if (ab.id === 'parashyut') {
      var before = v.hp;
      v.hp = Math.min(v.maxHp, v.hp + 5);
      v.shield = Math.max(v.shield, 4);
      events.push('Урон отменён, ' + v.name + ' восстанавливает ' + (v.hp - before) + ' и получает щит.');
      return 0;
    }
    if (ab.id === 'fazovyi') {
      v.mental = Math.max(0, v.mental - 2);
      events.push(v.name + ' полностью игнорирует урон, теряя две менталки.');
      return 0;
    }
    if (ab.id === 'parirovanie') {
      if (opts.attacker !== undefined) {
        events.push('Парирование: весь удар возвращается нападающему.');
        damage(s, opts.attacker, amount, events, { pierce: true });
      }
      return 0;
    }
    if (ab.id === 'pyanaya') {
      var sides = neighbors(s, opts.attacker !== undefined ? opts.attacker : v.idx);
      var redirectTo = sides.length ? sides[0] : null;
      if (redirectTo !== null && redirectTo !== undefined) {
        events.push('Пьяная траектория: урон уходит в соседа атакующего.');
        damage(s, redirectTo, amount, events, { pierce: true });
        return 0;
      }
    }
  }
  return amount;
}

/* ---------- операции ---------- */

function applyOps(s, actor, ops, ctx, events) {
  for (var i = 0; i < ops.length; i++) {
    var op = ops[i];
    var targets = resolveTargets(s, actor, op, ctx);
    var amount = op.n;

    switch (op.t) {
      case 'dmg':
        /* прибавка к урону работает от любого источника: атака, способность, артефакт */
        var opBonus = 0;
        if (actor.buff > 0 && op.who !== 'self') {
          opBonus = actor.buff;
          actor.buff = 0;
          events.push('Прибавка к урону: +' + opBonus + '.');
        }
        for (var d = 0; d < targets.length; d++) {
          var amountNow = d === 0 ? amount + opBonus : amount;
          var dealt = damage(s, targets[d], amountNow, events, { attacker: actor.idx, pierce: op.pierce, directed: op.who === 'target' });
          if (actor.charId === 'lyusya' && targets.length > 1 && dealt > 0) {
            if (actor.hand.length < actor.artifactLimit) {
              if (!s.deck.length) reshuffleDeck(s, events);
              if (s.deck.length) {
                actor.hand.push(s.deck.shift());
                events.push('Хайп: Люся берёт артефакт.');
              }
            } else {
              events.push('Хайп: рука артефактов полна.');
            }
          }
          if (op.leechPerTarget && dealt > 0) {
            actor.hp = Math.min(actor.maxHp, actor.hp + op.leechPerTarget);
            events.push(actor.name + ' восстанавливает ' + op.leechPerTarget + ' за задетую цель.');
          }
          if (op.leech && dealt > 0) {
            actor.hp = Math.min(actor.maxHp, actor.hp + dealt);
            events.push(actor.name + ' восстанавливает ' + dealt + '.');
          }
        }
        break;

      case 'dmgMissing':
        var ownMissing = Math.max(0, actor.maxHp - actor.hp);
        var ownBonus = Math.floor(ownMissing / op.per);
        for (var m = 0; m < targets.length; m++) {
          damage(s, targets[m], op.base + ownBonus, events, { attacker: actor.idx });
        }
        break;

      case 'dmgMissingMental':
        for (var mm = 0; mm < targets.length; mm++) {
          var tm = s.players[targets[mm]];
          var lack = Math.max(0, tm.maxMental - tm.mental);
          var val = Math.min(op.max, lack + op.bonus);
          damage(s, targets[mm], val, events, { attacker: actor.idx });
        }
        break;

      case 'dmgDiff':
        for (var dd = 0; dd < targets.length; dd++) {
          var td = s.players[targets[dd]];
          var diff = td.hp - actor.hp;
          if (diff > 0) damage(s, targets[dd], Math.min(op.max, diff), events, { attacker: actor.idx });
        }
        break;

      case 'dmgIfArtifacts':
        for (var da = 0; da < targets.length; da++) {
          if (s.players[targets[da]].hand.length >= op.need) damage(s, targets[da], amount, events, { attacker: actor.idx });
        }
        break;

      case 'shieldBreaker':
        for (var sb = 0; sb < targets.length; sb++) {
          var tsb = s.players[targets[sb]];
          if (tsb.shield > 0) {
            damage(s, targets[sb], op.through, events, { attacker: actor.idx, pierce: true });
            tsb.shield = Math.max(0, tsb.shield - op.toShield);
            events.push('Щит ' + tsb.gen + ' срезан на ' + op.toShield + '.');
          } else {
            damage(s, targets[sb], op.plain, events, { attacker: actor.idx });
          }
        }
        break;

      case 'heal':
        for (var h = 0; h < targets.length; h++) {
          var th = s.players[targets[h]];
          if (!th.alive) continue;
          var healAmount = amount;
          if (op.lowHp !== undefined && th.hp <= op.lowHp) healAmount = op.lowN;
          if (th.charId === 'grog' && th.hp <= 11) healAmount += 1;
          if (th.charId === 'grigori' && th.hand.length >= 2) healAmount += 1;
          var beforeH = th.hp;
          th.hp = Math.min(th.maxHp, th.hp + healAmount);
          events.push(th.name + ' восстанавливает ' + (th.hp - beforeH) + ', теперь ' + th.hp + '.');
          if (th.dot > 0) {
            th.dot = 0;
            events.push('Отложенный урон снят лечением.');
          }
        }
        break;

      case 'drainHp':
        for (var dh = 0; dh < targets.length; dh++) {
          var lost = Math.min(s.players[targets[dh]].hp, op.n);
          damage(s, targets[dh], lost, events, { attacker: actor.idx, pierce: true });
          actor.hp = Math.min(actor.maxHp, actor.hp + lost);
        }
        break;

      case 'shield':
        var shieldVal = amount;
        if (op.lessIfNoArtifact !== undefined && !actor.hand.length) shieldVal = op.lessIfNoArtifact;
        if (op.lessIfFewArtifacts !== undefined && actor.hand.length < (op.richAt || 1)) shieldVal = op.lessIfFewArtifacts;
        if (actor.charId === 'grigori' && actor.hand.length >= 2) shieldVal += 1;

        var maxCards = actor.charId === 'heil' ? 2 : 1;
        var cards = actor.shieldCards;

        /* пока активные карты щита не сброшены, новые ставить нельзя */
        if (cards.length >= maxCards) {
          events.push('Активная карта щита уже есть.');
          break;
        }
        cards.push({ value: shieldVal });
        actor.shield += shieldVal;
        if (actor.shield > actor.shieldCap) {
          var over = actor.shield - actor.shieldCap;
          actor.shield = actor.shieldCap;
          var last = cards[cards.length - 1];
          last.value = Math.max(0, last.value - over);
          if (last.value === 0) cards.pop();
        }
        actor.shieldForever = true;
        if (op.punish) actor.shieldPunish = op.punish;
        if (op.punishAll) actor.shieldAllPunish = op.punishAll;
        if (op.reduce) actor.reduce = Math.max(actor.reduce, op.reduce);
        events.push('Щит ' + actor.gen + ': ' + actor.shield + ' из ' + actor.shieldCap + '.');
        break;

      case 'shieldDown':
        for (var sd = 0; sd < targets.length; sd++) {
          var tsd = s.players[targets[sd]];
          if (tsd.shield > 0) {
            tsd.shield = Math.max(0, tsd.shield - op.n);
            events.push('Щит ' + tsd.gen + ' уменьшен до ' + tsd.shield + '.');
          }
        }
        break;

      case 'energy':
        for (var e = 0; e < targets.length; e++) {
          var te = s.players[targets[e]];
          if (op.n < 0) te.mana = Math.max(0, te.mana + op.n);
          else te.mana = Math.min(te.maxMana, te.mana + op.n);
          events.push(te.name + ': энергия ' + te.mana + '.');
        }
        break;

      case 'mental':
        for (var mnt = 0; mnt < targets.length; mnt++) {
          var tmn = s.players[targets[mnt]];
          if (op.n === -99) tmn.mental = 0;
          else if (op.n < 0) tmn.mental = Math.max(0, tmn.mental + op.n);
          else tmn.mental = Math.min(tmn.maxMental, tmn.mental + op.n);
          events.push(tmn.name + ': менталка ' + tmn.mental + '.');
        }
        break;

      case 'skip':
        for (var sk = 0; sk < targets.length; sk++) s.players[targets[sk]].skipNext = 1;
        events.push('Пропуск хода.');
        break;

      case 'dot':
        for (var dt = 0; dt < targets.length; dt++) {
          s.players[targets[dt]].dot = Math.max(s.players[targets[dt]].dot, op.n);
        }
        events.push('Дебаф: ' + op.n + ' урона в конце хода цели, если не вылечится.');
        break;

      case 'noAttack':
        for (var na = 0; na < targets.length; na++) s.players[targets[na]].noAttack = 1;
        events.push('Запрет обычной атаки.');
        break;

      case 'noAbilities':
        for (var nab = 0; nab < targets.length; nab++) s.players[targets[nab]].noAbilities = 1;
        events.push('Запрет способностей.');
        break;

      case 'noArtifacts':
        for (var nar = 0; nar < targets.length; nar++) s.players[targets[nar]].noArtifacts = 1;
        events.push('Запрет артефактов.');
        break;

      case 'noAttackNeighbors':
        var nb = neighbors(s, actor.idx);
        for (var nn = 0; nn < nb.length; nn++) s.players[nb[nn]].noAttack = 1;
        break;

      case 'stealArtifact':
        for (var sa = 0; sa < targets.length; sa++) {
          var tsa = s.players[targets[sa]];
          for (var k = 0; k < (op.n || 1); k++) {
            if (!tsa.hand.length) break;
            if (actor.hand.length >= actor.artifactLimit) break;
            var card = tsa.hand.splice(Math.floor(rand(s) * tsa.hand.length), 1)[0];
            actor.hand.push(card);
            events.push(actor.name + ' забирает ' + artifactById(card).name + '.');
          }
        }
        break;

      case 'giveArtifact':
        if (actor.hand.length) {
          var giver = actor.hand.shift();
          s.players[targets[0]].hand.push(giver);
          events.push(actor.name + ' отдаёт ' + artifactById(giver).name + '.');
        }
        break;

      case 'discardArtifact':
        var dcountA = op.n || 1;
        for (var dca = 0; dca < targets.length; dca++) {
          var tdc = s.players[targets[dca]];
          if (!tdc.hand.length) {
            events.push('Артефактов нет.');
            continue;
          }
          for (var dcA = 0; dcA < dcountA; dcA++) {
            if (!tdc.hand.length) break;
            var dropped = tdc.hand.splice(Math.floor(rand(s) * tdc.hand.length), 1)[0];
            pileArtifact(s, dropped);
            events.push(tdc.name + ' сбрасывает ' + artifactById(dropped).name + '.');
          }
        }
        break;

      case 'discardOrDamage':
        for (var dod = 0; dod < targets.length; dod++) {
          var tdod = s.players[targets[dod]];
          var hadSomething = false;
          if (tdod.abilities.length) {
            var lostD = tdod.abilities.splice(Math.floor(rand(s) * tdod.abilities.length), 1)[0];
            pileAfterUse(s, tdod, lostD);
            events.push(tdod.name + ' теряет способность «' + lostD.name + '».');
            hadSomething = true;
          }
          if (tdod.hand.length) {
            var cardD = tdod.hand.splice(Math.floor(rand(s) * tdod.hand.length), 1)[0];
            pileArtifact(s, cardD);
            events.push(tdod.name + ' сбрасывает ' + artifactById(cardD).name + '.');
            hadSomething = true;
          }
          if (!hadSomething) {
            damage(s, targets[dod], op.n, events, { attacker: actor.idx });
          }
        }
        break;

      case 'discardAbility':
        for (var dab = 0; dab < targets.length; dab++) {
          var tda = s.players[targets[dab]];
          for (var q2 = 0; q2 < op.n; q2++) {
            if (!tda.abilities.length) break;
            var lost = tda.abilities.splice(Math.floor(rand(s) * tda.abilities.length), 1)[0];
            if (tda.pool.length > 0) tda.oldDiscard.push(lost); else tda.newDiscard.push(lost);
            events.push(tda.name + ' теряет способность «' + lost.name + '».');
          }
        }
        break;

      case 'stealAbility':
        for (var sab = 0; sab < targets.length; sab++) {
          var tsa2 = s.players[targets[sab]];
          for (var q3 = 0; q3 < op.n; q3++) {
            if (!tsa2.abilities.length) break;
            var taken = tsa2.abilities.splice(Math.floor(rand(s) * tsa2.abilities.length), 1)[0];
            /* копия, чтобы метка «сворована» не оставалась на общей карте между партиями */
            taken = Object.assign({}, taken);
            taken.stolen = true;
            taken.stolenFrom = tsa2.name;
            var ownCount = actor.abilities.filter(function (x) { return !x.stolen; }).length;
            var stolenCount = actor.abilities.filter(function (x) { return x.stolen; }).length;
            if (ownCount >= actor.handLimit && stolenCount < 6) {
              actor.abilities.push(taken);
              events.push(actor.name + ' забирает способность «' + taken.name + '» сверх лимита руки.');
            } else if (ownCount < actor.handLimit) {
              actor.abilities.push(taken);
              events.push(actor.name + ' забирает способность «' + taken.name + '».');
            } else {
              tsa2.abilities.push(taken);
              events.push('Ворованных уже шесть, карта остаётся у цели.');
              break;
            }
          }
        }
        break;

      case 'returnAbility':
        for (var ra = 0; ra < op.n; ra++) {
          if (!actor.oldDiscard.length) break;
          var back = actor.oldDiscard.pop();
          actor.abilities.push(back);
          events.push(actor.name + ' возвращает «' + back.name + '».');
        }
        break;

      case 'drawAbility':
        for (var dra = 0; dra < op.n; dra++) {
          if (!actor.pool.length) break;
          var picked = actor.pool.shift();
          actor.abilities.push(picked);
          events.push(actor.name + ' берёт «' + picked.name + '» из колоды.');
        }
        break;

      case 'drawArtifact':
        for (var dar = 0; dar < op.n; dar++) {
          if (actor.hand.length >= actor.artifactLimit) break;
          if (!s.deck.length) reshuffleDeck(s, events);
          if (!s.deck.length) break;
          actor.hand.push(s.deck.shift());
        }
        events.push(actor.name + ' берёт ' + op.n + ' артефакт(ов) из колоды.');
        break;

      case 'purge':
        actor.skipNext = 0;
        actor.noAttack = 0;
        actor.noAbilities = 0;
        actor.noArtifacts = 0;
        actor.weakened = 0;
        events.push(actor.name + ' сбрасывает контроль и запреты.');
        break;

      case 'buff':
        actor.buff += op.n;
        events.push('Урон следующей атаки увеличен на ' + op.n + '.');
        break;

      case 'weaken':
        for (var wk = 0; wk < targets.length; wk++) {
      s.players[targets[wk]].weakened = op.n;
      s.players[targets[wk]].weakenTurns = op.turns || 1;
    }
        events.push('Цель бьёт слабее на ' + op.n + '.');
        break;

      case 'dmgReduce':
        actor.reduce = Math.max(actor.reduce, op.n);
        actor.reduceTurns = Math.max(actor.reduceTurns, op.turns || 1);
        events.push('Получаемый урон снижен на ' + op.n + ' на ' + (op.turns || 1) + ' хода.');
        break;

      case 'blockNext':
        actor.blockNext = 1;
        events.push('Следующий удар будет заблокирован.');
        break;

      case 'negate':
        break;

      case 'extraAction':
        actor.extraActions += (op.n || 1);
        events.push(actor.name + ' получает дополнительное действие.');
        break;

      case 'mark':
        for (var mk = 0; mk < targets.length; mk++) s.players[targets[mk]].marked = op.heal;
        events.push('Метка контракта на ' + s.players[targets[0]].dat + '.');
        break;

      case 'tax':
        for (var tx = 0; tx < targets.length; tx++) s.players[targets[tx]].tax = 1;
        events.push('Цель платит больше до вашего следующего хода.');
        break;

      case 'taunt':
        for (var tt = 0; tt < targets.length; tt++) s.players[targets[tt]].forceAttack = actor.idx;
        damage(s, targets[0], op.n || 3, events, { attacker: actor.idx });
        events.push('Цель обязана ударить в ответ.');
        break;

      case 'puppet':
        var victim = pickWeakest(s, actor.idx, targets[0]);
        if (victim !== null) {
          events.push(s.players[targets[0]].name + ' бьёт ' + s.players[victim].name + '.');
          damage(s, victim, s.players[targets[0]].dmg + (op.bonus || 0), events, { attacker: targets[0] });
        }
        break;

      case 'forceAttack':
        for (var fa = 0; fa < targets.length; fa++) s.players[targets[fa]].forceAttack = -1;
        events.push('Цель обязана атаковать соседа.');
        break;

      case 'forbidExpensive':
        s.forbidExpensive = op.n;
        events.push('Дорогие карты запрещены до вашего следующего хода.');
        break;

      case 'forbidBig':
        s.forbidAbilityMin = op.abilityMin || 0;
        s.forbidArtifactMin = op.artifactMin || 0;
        events.push('Запрет: способности от ' + s.forbidAbilityMin + ', артефакты от ' + s.forbidArtifactMin + '.');
        break;

      case 'massControl': {
        var mcOrder = [];
        for (var mc = 0; mc < s.players.length; mc++) {
          if (s.players[mc].alive && mc !== actor.idx) mcOrder.push(mc);
        }
        mcOrder.sort(function (a, b) { return s.players[a].hp - s.players[b].hp; });

        /* подчинённые бьют друг друга, а не Эт’Кору */
        var pickVictimTarget = function (vicIdx) {
          var bestIdx = -1;
          var bestHp = 9999;
          for (var pv = 0; pv < s.players.length; pv++) {
            if (!s.players[pv].alive) continue;
            if (pv === vicIdx) continue;
            if (pv === actor.idx) continue;
            if (s.players[pv].hp < bestHp) { bestHp = s.players[pv].hp; bestIdx = pv; }
          }
          if (bestIdx < 0) {
            for (var pv2 = 0; pv2 < s.players.length; pv2++) {
              if (s.players[pv2].alive && pv2 !== vicIdx) { bestIdx = pv2; break; }
            }
          }
          return bestIdx < 0 ? vicIdx : bestIdx;
        };

        var damageValue = function (ops) {
          var total = 0;
          for (var dv = 0; dv < ops.length; dv++) {
            var o = ops[dv];
            if (o.t === 'dmg' && o.who !== 'self') total += o.n || 0;
            if (o.t === 'dmgMissingMental' || o.t === 'dmgDiff') total += o.max || 5;
            if (o.t === 'shieldBreaker') total += o.plain || 4;
          }
          return total;
        };

        for (var mc2 = 0; mc2 < mcOrder.length; mc2++) {
          var vic = s.players[mcOrder[mc2]];
          if (!vic.alive) continue;
          var tgt2 = pickVictimTarget(vic.idx);
          var acted2 = false;

          var bestAb = null;
          var bestVal2 = 0;
          for (var bi2 = 0; bi2 < vic.abilities.length; bi2++) {
            var ab2 = vic.abilities[bi2];
            if (ab2.modes) continue;
            var v2 = damageValue(ab2.ops || []);
            if (v2 > bestVal2) { bestVal2 = v2; bestAb = ab2; }
          }
          if (bestAb) {
            events.push('Психоз: ' + vic.name + ' бьёт способностью «' + bestAb.name + '».');
            applyOps(s, vic, bestAb.ops, { target: tgt2 }, events);
            acted2 = true;
          }

          if (!acted2) {
            for (var ai2 = 0; ai2 < vic.hand.length; ai2++) {
              var art2 = artifactById(vic.hand[ai2]);
              if (damageValue(art2.ops || []) > 0) {
                events.push('Психоз: ' + vic.name + ' применяет ' + art2.name + '.');
                vic.hand.splice(ai2, 1);
                applyOps(s, vic, art2.ops, { target: tgt2 }, events);
                acted2 = true;
                break;
              }
            }
          }

          if (!acted2) {
            for (var si2 = 0; si2 < vic.abilities.length; si2++) {
              var sb2 = vic.abilities[si2];
              if (sb2.modes) continue;
              var hasShield2 = (sb2.ops || []).some(function (o) { return o.t === 'shield'; });
              if (hasShield2) {
                events.push('Психоз: ' + vic.name + ' ставит щит.');
                applyOps(s, vic, sb2.ops, { target: tgt2 }, events);
                acted2 = true;
                break;
              }
            }
          }

          if (!acted2) {
            for (var hi2 = 0; hi2 < vic.abilities.length; hi2++) {
              var hb2 = vic.abilities[hi2];
              if (hb2.modes) continue;
              var hasHeal2 = (hb2.ops || []).some(function (o) { return o.t === 'heal'; });
              if (hasHeal2) {
                events.push('Психоз: ' + vic.name + ' лечится.');
                applyOps(s, vic, hb2.ops, { target: tgt2 }, events);
                acted2 = true;
                break;
              }
            }
          }

          if (!acted2) {
            events.push('Психоз: ' + vic.name + ' бьёт обычной атакой.');
            damage(s, tgt2, vic.dmg, events, { attacker: vic.idx, directed: true });
          }
        }
        break;
      }

      case 'taxAll': {
        for (var ta = 0; ta < s.players.length; ta++) {
          var tp2 = s.players[ta];
          if (!tp2.alive || ta === actor.idx) continue;
          tp2.weakened = Math.max(tp2.weakened || 0, 1);
          tp2.tax = 1;
        }
        events.push('Все платят больше и бьют слабее.');
        break;
      }

      case 'magBuff': {
        actor.buffAll = op.n || 1;
        actor.buffTurns = op.turns || 1;
        events.push(actor.name + ' усиливает свой урон на ' + (op.n || 1) + ' на ' + (op.turns || 1) + ' хода.');
        break;
      }

      case 'discardHalfArtifacts':
        for (var dha = 0; dha < targets.length; dha++) {
          var tdha = s.players[targets[dha]];
          if (!tdha.hand.length) {
            events.push(tdha.name + ': артефактов нет.');
            continue;
          }
          var halfCount = Math.ceil(tdha.hand.length / 2);
          if (halfCount < 1) halfCount = 1;
          var droppedHalf = 0;
          for (var dh = 0; dh < halfCount && tdha.hand.length; dh++) {
            pileArtifact(s, tdha.hand.pop());
            droppedHalf++;
          }
          events.push(tdha.name + ' сбрасывает ' + droppedHalf + ' артефактов.');
        }
        break;

      case 'discardAllArtifacts':
        for (var dla = 0; dla < targets.length; dla++) {
          var tdla = s.players[targets[dla]];
          while (tdla.hand.length) pileArtifact(s, tdla.hand.pop());
          events.push(tdla.name + ' сбрасывает все артефакты.');
        }
        break;

      case 'attackNeighbor':
        for (var anb = 0; anb < targets.length; anb++) {
          var tanb = s.players[targets[anb]];
          tanb.forceAttack = actor.idx;
        }
        events.push('Цель обязана ударить соседа.');
        break;

      case 'redirect':
      case 'reduceIncoming':
      case 'retaliate':
      case 'look':
      case 'lookDeck':
      case 'gainMaxHp':
      case 'mirrorRestrict':
        actor.restrictTarget = targets[0];
        actor.restrictArmed = false;
        events.push(actor.name + ' на следующем ходу не сможет бить ' + s.players[targets[0]].acc + '.');
        break;

      case 'noAttackSelf':
      case 'ifNone':
        break;

      default:
        break;
    }
  }
}

function resolveTargets(s, actor, op, ctx) {
  var who = op.who || 'self';
  if (who === 'self') return [actor.idx];
  if (who === 'target') return ctx.target !== null && ctx.target !== undefined ? [ctx.target] : [];
  if (who === 'others') {
    var out = [];
    for (var i = 0; i < s.players.length; i++) if (i !== actor.idx && s.players[i].alive) out.push(i);
    return out;
  }
  if (who === 'neighbors') return neighbors(s, actor.idx);
  return [];
}

function pickWeakest(s, excludeIdx, excludeIdx2) {
  var best = null;
  var bestHp = Infinity;
  for (var i = 0; i < s.players.length; i++) {
    if (i === excludeIdx || i === excludeIdx2 || !s.players[i].alive) continue;
    if (s.players[i].hp < bestHp) { bestHp = s.players[i].hp; best = i; }
  }
  return best;
}

/* Пока свежий пул не пуст, сыгранное идёт в старый сброс.
   Когда пул опустел, сыгранное идёт в новый сброс, из которого брать нельзя. */
function shieldCardsFull(p) {
  var maxCards = p.charId === 'heil' ? 2 : 1;
  return p.shieldCards.length >= maxCards;
}

function hasShieldOp(card) {
  var lists = [];
  if (card && card.ops) lists.push(card.ops);
  if (card && card.modes) for (var mi = 0; mi < card.modes.length; mi++) lists.push(card.modes[mi].ops || []);
  for (var li = 0; li < lists.length; li++) {
    for (var oi = 0; oi < lists[li].length; oi++) {
      if (lists[li][oi].t === 'shield') return true;
    }
  }
  return false;
}

function pileAfterUse(s, p, ab) {
  /* сворованная карта уходит в сброс тому, у кого её взяли */
  if (ab && ab.stolenFrom) {
    for (var i = 0; i < s.players.length; i++) {
      if (s.players[i].name === ab.stolenFrom) {
        var owner = s.players[i];
        var clean = Object.assign({}, ab);
        delete clean.stolen;
        delete clean.stolenFrom;
        if (owner.pool.length > 0) owner.oldDiscard.push(clean);
        else owner.newDiscard.push(clean);
        return;
      }
    }
  }
  if (p.pool.length > 0) p.oldDiscard.push(ab);
  else p.newDiscard.push(ab);
}

function pileArtifact(s, id) {
  if (s.recycling) s.newDiscard.push(id);
  else s.oldDiscard.push(id);
}

/* Колода добирается сначала из старого сброса, потом из нового. */
function reshuffleDeck(s, events) {
  if (s.oldDiscard.length) {
    s.deck = shuffle(s, s.oldDiscard);
    s.oldDiscard = [];
    s.recycling = true;
    events.push('Старый сброс артефактов перемешан в колоду.');
    return;
  }
  if (s.newDiscard.length) {
    s.deck = shuffle(s, s.newDiscard);
    s.newDiscard = [];
    s.recycling = false;
    events.push('Новый сброс артефактов перемешан в колоду.');
    return;
  }
  events.push('Артефактов больше нет.');
}

/* ---------- шаги выбора ---------- */

function needsTarget(def) {
  if (def.target) return true;
  if (def.ops) for (var i = 0; i < def.ops.length; i++) if (def.ops[i].who === 'target') return true;
  return false;
}

function nextStep(s, actionId, picks) {
  var p = me(s);
  if (actionId === 'ability') {
    if (picks.ability === undefined || picks.ability === null) {
      return { kind: 'ability', question: 'Какую способность?', options: abilityOptions(s, p) };
    }
    var ab = p.abilities[picks.ability];
    if (!ab) return null;
    var def = ab;
    if (ab.modes) {
      if (picks.mode === undefined || picks.mode === null) {
        return {
          kind: 'mode',
          question: 'Какой вариант?',
          options: ab.modes.map(function (m, i) {
            return { index: i, label: m.label + ' — ' + m.cost + ' энергии' };
          })
        };
      }
      def = ab.modes[picks.mode];
    }
    if (needsTarget(def) && (picks.target === undefined || picks.target === null)) {
      return { kind: 'player', question: 'На кого?', options: playerTargets(s, p) };
    }
    return null;
  }
  if (actionId === 'useArtifact') {
    if (!p.hand.length) return null;
    if (picks.artifact === undefined || picks.artifact === null) {
      return {
        kind: 'artifact',
        question: 'Какой артефакт?',
        options: p.hand.map(function (id, i) {
          var a = artifactById(id);
          return { index: i, label: a.name + ' — ' + a.cost };
        })
      };
    }
    var art = artifactById(p.hand[picks.artifact]);
    if (needsTarget(art) && (picks.target === undefined || picks.target === null)) {
      return { kind: 'player', question: 'На кого?', options: playerTargets(s, p) };
    }
    return null;
  }
  if (actionId === 'exchange') {
    if (!p.hand.length) return null;
    if (picks.artifact === undefined || picks.artifact === null) {
      return {
        kind: 'artifact',
        question: 'Какой артефакт обменять?',
        options: p.hand.map(function (id, i) {
          var a = artifactById(id);
          return { index: i, label: a.name + ' — обмен ' + a.trade };
        })
      };
    }
    var canRestore = nextExchangeCard(p) !== null && p.abilities.length < p.handLimit;
    if (canRestore && (picks.mode === undefined || picks.mode === null)) {
      return {
        kind: 'mode',
        question: 'На что обменять?',
        options: [
          { index: 0, label: 'на энергию' },
          { index: 1, label: 'на возврат сброшенной способности' }
        ]
      };
    }
    return null;
  }
  if (actionId === 'attack') {
    if (picks.target === undefined || picks.target === null) {
      var nb = neighbors(s, p.idx);
      return {
        kind: 'player',
        question: 'Кого бить?',
        options: nb.map(function (i) { return { index: i, label: s.players[i].name }; })
      };
    }
  }
  return null;
}

/* ---------- действия ---------- */

function apply(s, actionId, picks) {
  picks = picks || {};
  var p = me(s);
  var events = [];
  var freeAction = false;

  if (s.phase === 'over') return { ok: false, text: 'Партия окончена.' };
  if (s.phase !== 'main') return { ok: false, text: 'Сейчас не ваш ход.' };

  if (actionId === 'attack') {
    if (p.noAttack > 0) return { ok: false, text: 'Обычная атака запрещена.' };
    if (picks.steal) {
      if (p.charId !== 'zhulien') return { ok: false, text: 'Только Жюльен умеет красть вместо удара.' };
      var st = picks.target === undefined || picks.target === null ? null : s.players[picks.target];
      if (!st || !st.alive) return { ok: false, text: 'Нужна цель.' };
      if (!st.hand.length) return { ok: false, text: 'У цели нет артефактов.' };
      if (neighbors(s, p.idx).indexOf(picks.target) === -1) return { ok: false, text: 'Бить можно только соседа.' };
      var stolenCard = st.hand.splice(Math.floor(rand(s) * st.hand.length), 1)[0];
      p.hand.push(stolenCard);
      events.push(p.name + ' крадёт ' + artifactById(stolenCard).name + ' вместо удара.');
      s.events = events;
      endTurn(s, events);
      return { ok: true, text: events.join(' ') };
    }
    if (p.restrictArmed && p.restrictTarget !== null && picks.target === p.restrictTarget) {
      return { ok: false, text: 'Мирный договор: эту цель бить нельзя до конца хода.' };
    }
    var nb = neighbors(s, p.idx);
    if (!nb.length) return { ok: false, text: 'Соседей нет.' };
    var target = picks.target === undefined || picks.target === null ? nb[0] : picks.target;
    if (nb.indexOf(target) === -1) return { ok: false, text: 'Бить можно только соседа.' };
    var dmgVal = p.dmg + p.buff;
    if (p.charId === 'borya') {
      var missBA = Math.max(0, p.maxMana - p.mana);
      if (missBA >= 4) dmgVal += 2;
      else if (missBA >= 2) dmgVal += 1;
    }
    if (p.charId === 'grigori' && p.hand.length >= 1) dmgVal += 1;
    if (p.charId === 'grog' && p.hp <= 7) dmgVal += 1;
    if (p.weakened) dmgVal = Math.max(1, dmgVal - p.weakened);
    events.push(p.name + ' атакует ' + s.players[target].acc + '.');
    p.buff = 0;
    damage(s, target, dmgVal, events, { attacker: p.idx, directed: true });
  } else if (actionId === 'ability') {
    var ab = p.abilities[picks.ability];
    if (!ab) return { ok: false, text: 'Нет такой способности.' };
    if (p.noAbilities > 0) return { ok: false, text: 'Способности запрещены.' };
    var def = ab;
    var cost = ab.cost;
    if (ab.modes) {
      if (picks.mode === undefined || picks.mode === null) return { ok: false, text: 'Не выбран вариант.' };
      def = ab.modes[picks.mode];
      if (!def) return { ok: false, text: 'Нет такого варианта.' };
      cost = def.cost;
    }
    if (s.forbidExpensive && cost >= s.forbidExpensive) return { ok: false, text: 'Запретительный указ: карта слишком дорогая.' };
    if (s.forbidAbilityMin && cost >= s.forbidAbilityMin) return { ok: false, text: 'Способности такой стоимости запрещены.' };
    var totalCost = cost + (p.tax || 0);
    if (p.charId === 'hrom' && p.shield > 0) totalCost = Math.max(0, totalCost - 1);
    if (p.charId === 'etkora' && ab.stolen) totalCost = Math.max(0, totalCost - 1);
      if (p.mana < totalCost) return { ok: false, text: 'Не хватает энергии: нужно ' + totalCost + ', есть ' + p.mana + '.' };
    if (ab.needArtifacts && p.hand.length < ab.needArtifacts) {
      return { ok: false, text: 'Нужно артефактов в руке: ' + ab.needArtifacts + ', есть ' + p.hand.length + '.' };
    }
    if (hasShieldOp(def) && shieldCardsFull(p)) return { ok: false, text: 'Щит уже активен, новую карту щита ставить нельзя.' };
    var needT = needsTarget(def);
    if (needT && (picks.target === undefined || picks.target === null)) return { ok: false, text: 'Нужна цель.' };
    p.mana -= totalCost;
    p.tax = 0;
    events.push(p.name + ' применяет «' + ab.name + '»' + (ab.modes ? ' — ' + def.label : '') + '.');
    applyOps(s, p, def.ops, { target: needT ? picks.target : null }, events);
    var usedAt = p.abilities.indexOf(ab);
    if (usedAt >= 0) {
      p.abilities.splice(usedAt, 1);
      pileAfterUse(s, p, ab);
    }
  } else if (actionId === 'useArtifact') {
    var cardId = p.hand[picks.artifact];
    if (!cardId) return { ok: false, text: 'Нет такого артефакта.' };
    if (p.noArtifacts > 0) return { ok: false, text: 'Артефакты запрещены.' };
    var art = artifactById(cardId);
    var payMental = art.world !== p.world ? art.cost : 0;
    if (s.freeArtifacts) payMental = 0;
    if (p.charId === 'omnis' && payMental > 0) payMental = Math.max(0, payMental - 2);
    if (p.charId === 'hrom' && p.shield > 0 && payMental > 0) payMental = Math.max(0, payMental - 1);
      if (s.forbidArtifactMin && art.cost >= s.forbidArtifactMin) return { ok: false, text: 'Артефакты такой цены запрещены.' };
    if (p.mental < payMental) return { ok: false, text: 'Не хватает менталки: нужно ' + payMental + '.' };
    if (hasShieldOp(art) && shieldCardsFull(p)) return { ok: false, text: 'Щит уже активен, новую карту щита ставить нельзя.' };
    var needTA = needsTarget(art);
    if (needTA && (picks.target === undefined || picks.target === null)) return { ok: false, text: 'Нужна цель.' };
    p.mental -= payMental;
    p.hand.splice(picks.artifact, 1);
    pileArtifact(s, cardId);
    events.push(p.name + ' применяет ' + art.name + '.');
    applyOps(s, p, art.ops, { target: needTA ? picks.target : null }, events);
    if (p.comboMode) {
      if (cardId === 'altar') p.comboAltarUsed = true;
      if (cardId === 'neyrostim') p.comboNeuroUsed = true;
    }
    if (art.freeAction) freeAction = true;
  } else if (actionId === 'trade') {
    if (p.charId !== 'mirai') return { ok: false, text: 'Только Мирай умеет меняться.' };
    if (p.passiveUsed.trade) return { ok: false, text: 'Раз за ход.' };
    var tp = picks.target === undefined || picks.target === null ? null : s.players[picks.target];
    if (!tp || !tp.alive || tp.idx === p.idx) return { ok: false, text: 'Нужен другой игрок.' };
    if (!tp.hand.length) return { ok: false, text: 'У цели нет артефактов.' };
    var cyberIdx = -1;
    for (var ci = 0; ci < tp.hand.length; ci++) {
      if (artifactById(tp.hand[ci]).world === 'cyber') { cyberIdx = ci; break; }
    }
    var pickIdx = cyberIdx >= 0 ? cyberIdx : Math.floor(rand(s) * tp.hand.length);
    var gotCard = tp.hand.splice(pickIdx, 1)[0];
    p.hand.push(gotCard);
    if (p.hand.length > 1) {
      var giveIdx = 0;
      for (var gi = 0; gi < p.hand.length; gi++) {
        if (p.hand[gi] !== gotCard) { giveIdx = gi; break; }
      }
      var giveCard = p.hand.splice(giveIdx, 1)[0];
      tp.hand.push(giveCard);
      events.push(p.name + ' меняется: отдаёт ' + artifactById(giveCard).name + ' и берёт ' + artifactById(gotCard).name + '.');
    } else {
      events.push(p.name + ' забирает ' + artifactById(gotCard).name + '.');
    }
    p.passiveUsed.trade = true;
    s.events = events;
    return { ok: true, text: events.join(' ') };
  } else if (actionId === 'restore') {
    if (p.charId !== 'glyuk') return { ok: false, text: 'Только Глюк умеет это.' };
    if (p.abilities.length) return { ok: false, text: 'Рука не пуста.' };
    if (p.passiveUsed.restore) return { ok: false, text: 'Раз за ход.' };
    var got2 = 0;
    for (var r2 = 0; r2 < 2; r2++) {
      var card2 = null;
      if (p.pool.length) card2 = p.pool.pop();
      else if (p.oldDiscard.length) card2 = p.oldDiscard.pop();
      if (!card2) break;
      p.abilities.push(card2);
      got2++;
    }
    if (!got2) return { ok: false, text: 'Брать нечего.' };
    p.passiveUsed.restore = true;
    events.push(p.name + ' восстанавливает ' + got2 + ' способности без действия.');
    s.events = events;
    return { ok: true, text: events.join(' ') };
  } else if (actionId === 'take') {
    if (p.hand.length >= p.artifactLimit) return { ok: false, text: 'Рука артефактов полна: ' + p.artifactLimit + '.' };
    if (!s.deck.length) reshuffleDeck(s, events);
    var takeCount = 1;
    var gotAny = 0;
    for (var tk = 0; tk < takeCount && p.hand.length < p.artifactLimit; tk++) {
      if (!s.deck.length) reshuffleDeck(s, events);
      if (!s.deck.length) break;
      p.hand.push(s.deck.shift());
      gotAny++;
    }
    if (!gotAny) return { ok: false, text: 'Колода пуста.' };
    events.push(p.name + ' берёт артефактов: ' + gotAny + '.');
  } else if (actionId === 'exchange') {
    if (!p.hand.length) return { ok: false, text: 'Нечего обменивать.' };
    var idx = picks.artifact === undefined || picks.artifact === null ? 0 : picks.artifact;
    var exId = p.hand[idx];
    if (!exId) return { ok: false, text: 'Нет такого артефакта.' };
    var ex = artifactById(exId);
    var wantAbility = picks.mode === 1;

    if (wantAbility) {
      if (p.abilities.length >= p.handLimit) return { ok: false, text: 'Рука заполнена.' };
      var taken = null;
      var fromWhere = '';
      if (p.charId === 'mag') {
        /* маг выбирает лучшую карту из свежего пула, а когда пул пуст — любую из старого сброса */
        var poolBest = null;
        var poolIdx = -1;
        for (var pi = 0; pi < p.pool.length; pi++) {
          var pv = scoreOps(p.pool[pi].ops || [], s, p, pickWeakest(s, p.idx, -1)) / Math.max(1, p.pool[pi].cost);
          if (poolBest === null || pv > poolBest) { poolBest = pv; poolIdx = pi; }
        }
        if (poolIdx >= 0) {
          taken = p.pool.splice(poolIdx, 1)[0];
          fromWhere = 'из свежего пула по выбору';
        } else if (p.oldDiscard.length > 0) {
          var oldBest = -1;
          var oldIdx = 0;
          for (var oi = 0; oi < p.oldDiscard.length; oi++) {
            var ov = scoreOps(p.oldDiscard[oi].ops || [], s, p, pickWeakest(s, p.idx, -1)) / Math.max(1, p.oldDiscard[oi].cost);
            if (ov > oldBest) { oldBest = ov; oldIdx = oi; }
          }
          taken = p.oldDiscard.splice(oldIdx, 1)[0];
          fromWhere = 'из старого сброса по выбору';
        }
      } else if (p.pool.length > 0) {
        taken = p.pool.pop();
        fromWhere = 'из свежего пула';
      } else if (p.oldDiscard.length > 0) {
        taken = p.oldDiscard.pop();
        fromWhere = 'сверху старого сброса';
      }
      if (!taken) return { ok: false, text: 'Брать нечего: пул и старый сброс пусты.' };
      p.hand.splice(idx, 1);
      pileArtifact(s, exId);
      p.abilities.push(taken);
      if (p.charId === 'mag') {
        p.mana = Math.min(p.maxMana, p.mana + ex.trade);
        events.push(p.name + ' обменивает ' + ex.name + ' и получает «' + taken.name + '» ' + fromWhere + ', а также ' + ex.trade + ' энергии.');
      } else {
        events.push(p.name + ' обменивает ' + ex.name + ' и берёт «' + taken.name + '» ' + fromWhere + '.');
      }
      freeAction = true;
    } else {
      p.hand.splice(idx, 1);
      pileArtifact(s, exId);
      p.mana = Math.min(p.maxMana, p.mana + ex.trade);
      events.push(p.name + ' обменивает ' + ex.name + ' на энергию.');
      freeAction = true;
    }
  } else if (actionId === 'pass') {
    events.push(p.name + ' пропускает ход.');
  } else {
    return { ok: false, text: 'Неизвестное действие.' };
  }

  s.events = events;
  checkWinner(s);
  if (s.phase === 'over') return { ok: true, text: events.join(' ') };

  if (freeAction) return { ok: true, text: events.join(' ') };
  endTurn(s, events);
  return { ok: true, text: events.join(' ') };
}

function endTurn(s, events) {
  var p = me(s);

  /* отложенный урон: если за ход не вылечились, дебаф бьёт в конце хода */
  if (p.dot > 0) {
    events.push('Отложенный урон по ' + p.dat + ' срабатывает.');
    damage(s, p.idx, p.dot, events, { pierce: true });
    p.dot = 0;
    checkWinner(s);
  }
  if (p.extraActions > 0) {
    p.extraActions--;
    return;
  }
  p.noAttack = 0;
  p.noAbilities = 0;
  p.noArtifacts = 0;
  p.tax = 0;
  p.comboAltarUsed = false;
  p.comboNeuroUsed = false;
  if (p.weakenTurns > 0) {
    p.weakenTurns--;
    if (p.weakenTurns === 0) p.weakened = 0;
  } else {
    p.weakened = 0;
  }
  if (p.buffTurns > 0) {
    p.buffTurns--;
    if (p.buffTurns === 0) p.buffAll = 0;
  }
  p.forceAttack = 0;
  p.marked = 0;
  s.forbidExpensive = 0;
  s.forbidAbilityMin = 0;
  s.forbidArtifactMin = 0;

  s.turn = nextAlive(s, s.turn);

  /* щит держится до разрушения, снижение урона живёт ограниченное число ходов */
  if (p.restrictArmed) {
    p.restrictArmed = false;
    p.restrictTarget = null;
  }

  var nextP = s.players[s.turn];
  nextP.passiveUsed = {};
  if (nextP.restrictTarget !== null) nextP.restrictArmed = true;
  if (nextP.reduceTurns > 0) {
    nextP.reduceTurns--;
    if (nextP.reduceTurns === 0) nextP.reduce = 0;
  }
  s.round = Math.floor(s.turnsTaken ? 0 : 0) + s.round;
  var cur = s.players[s.turn];
  if (s.turn === 0) s.round++;

  if (cur.skipNext > 0) {
    cur.skipNext = 0;
    events.push(cur.name + ' пропускает ход.');
    s.turn = nextAlive(s, s.turn);
  }
  var startP = s.players[s.turn];
  if (startP.dotStart) {
    startP.dotStart = false;
    startP.dot = 0;
  }
}

function nextAlive(s, from) {
  for (var i = 1; i <= s.players.length; i++) {
    var idx = (from + i) % s.players.length;
    if (s.players[idx].alive) return idx;
  }
  return from;
}

function checkWinner(s) {
  var alive = [];
  for (var i = 0; i < s.players.length; i++) if (s.players[i].alive) alive.push(i);
  if (alive.length === 1) {
    s.winner = alive[0];
    s.phase = 'over';
  } else if (alive.length === 0) {
    s.winner = null;
    s.phase = 'over';
  }
}

function isOver(s) {
  return s.phase === 'over';
}

function me(s) {
  return s.players[s.turn];
}

/* ---------- бот ---------- */

/* Насколько персонаж в опасности: ноль — целый, единица — на грани. */
function dangerLevel(p) {
  return Math.max(0, Math.min(1, 1 - p.hp / Math.max(1, p.maxHp)));
}

/* Средний урон, который может прилететь за круг. */
function incomingThreat(s, actor) {
  var sum = 0;
  for (var i = 0; i < s.players.length; i++) {
    if (i === actor.idx || !s.players[i].alive) continue;
    sum += s.players[i].dmg;
  }
  return Math.max(3, sum);
}

function scoreOps(ops, s, actor, target) {
  var danger = dangerLevel(actor);
  var threat = incomingThreat(s, actor);
  var aggro = actor.style === 'aggro' ? 1 : (s.aggression || 0);
  var caution = actor.style === 'caution' ? 1 : (s.caution || 0);
  var dmgMul = 1.1 * (1 + aggro * 1.5) * (1 - caution * 0.45);
  var defMul = (1 - aggro * 0.9) * (1 + caution * 2);
  var val = 0;
  for (var i = 0; i < ops.length; i++) {
    var op = ops[i];
    var n = op.n || 0;
    var who = op.who || 'self';
    var count = 1;
    if (who === 'others') count = 0;
    for (var j = 0; j < s.players.length; j++) if (j !== actor.idx && s.players[j].alive) count++;
    if (who === 'neighbors') count = neighbors(s, actor.idx).length;

    if (op.t === 'dmg') {
      if (who === 'self') val -= n * dmgMul * (1 - aggro * 0.7) * (1 + caution);
      else val += n * dmgMul * count;
    } else if (op.t === 'dmgMissing' || op.t === 'dmgMissingMental' || op.t === 'dmgDiff' || op.t === 'shieldBreaker' || op.t === 'dmgIfArtifacts') {
      val += (op.plain || op.base || 3) * 1.1 * count;
    } else if (op.t === 'heal') {
      var missingHp = actor.maxHp - actor.hp;
      val += Math.min(op.n || 0, missingHp) * (1 + danger * 2) * defMul;
    } else if (op.t === 'shield' || op.t === 'dmgReduce' || op.t === 'blockNext') {
      var absorb = Math.min(op.n || 3, threat);
      val += absorb * (1 + danger * 2.5) * defMul;
    } else if (op.t === 'skip') {
      val += 4.0 * count * (1 + danger) * (1 + caution * 0.6);
    }
    else if (op.t === 'dot') val += (op.n || 0) * 1.0 * count;
    else if (op.t === 'energy' || op.t === 'mental') {
      val += who === 'self' ? n * 0.5 : -n * 0.6 * count;
    } else if (op.t === 'stealArtifact' || op.t === 'discardArtifact' || op.t === 'stealAbility' || op.t === 'discardAbility') {
      val += 2.5 * count;
    } else if (op.t === 'extraAction') val += 4.5 * (op.n || 1);
    else if (op.t === 'buff') val += (op.n || 0) * 1.2;
    else if (op.t === 'mark' || op.t === 'tax' || op.t === 'noAttack' || op.t === 'noAbilities' || op.t === 'noArtifacts') val += 2.0 * count;
    else if (op.t === 'purge') val += 1.0;
    else if (op.t === 'taunt') val += 3.0;
    else if (op.t === 'puppet') val += 3.5;
    else if (op.t === 'weaken') val += 2.0 * count;
    else if (op.t === 'drawArtifact' || op.t === 'drawAbility' || op.t === 'returnAbility') val += 1.5 * (op.n || 1);
    else if (op.t === 'forceAttack') val += 2.0;
  }
  if (s.preferExtra && ops.some(function (o) { return o.t === 'extraAction'; })) {
    val *= 2.5;
  }
  if (s.preferShield && ops.some(function (o) { return o.t === 'shield'; })) {
    val *= 2.5;
  }
  if (s.counterAware) {
    var foeArtifacts = 0;
    var foeAbilities = 0;
    var foes = 0;
    for (var fi = 0; fi < s.players.length; fi++) {
      if (fi === actor.idx || !s.players[fi].alive) continue;
      foeArtifacts += s.players[fi].hand.length;
      foeAbilities += s.players[fi].abilities.length;
      foes++;
    }
    var avgArt = foes ? foeArtifacts / foes : 0;
    var avgAb = foes ? foeAbilities / foes : 0;
    for (var oi = 0; oi < ops.length; oi++) {
      var t = ops[oi].t;
      if (t === 'stealArtifact' || t === 'discardArtifact' || t === 'discardAllArtifacts' || t === 'discardHalfArtifacts' || t === 'noArtifacts') {
        val += avgArt * 1.5;
      }
      if (t === 'stealAbility' || t === 'discardAbility' || t === 'noAbilities') {
        val += avgAb * 0.8;
      }
    }
  }
  return val;
}

function candidates(s, p) {
  var out = [];
  var weak = pickWeakest(s, p.idx, -1);

  if (p.noAttack === 0) {
    var nb = neighbors(s, p.idx);
    for (var i = 0; i < nb.length; i++) {
      if (p.restrictArmed && p.restrictTarget !== null && nb[i] === p.restrictTarget) continue;
      var t = s.players[nb[i]];
      var eff = Math.min(t.hp, p.dmg + p.buff);
      out.push({ action: 'attack', picks: { target: nb[i] }, score: eff * 1.1 + (t.hp <= 4 ? 2 : 0) });
    }
  }

  for (var j = 0; j < p.abilities.length; j++) {
    var ab = p.abilities[j];
    var variants = ab.modes ? ab.modes.map(function (m, mi) { return { def: m, mode: mi }; }) : [{ def: ab, mode: null }];
    for (var v = 0; v < variants.length; v++) {
      var def = variants[v].def;
      var cost = def.cost === undefined ? ab.cost : def.cost;
      if (p.mana < cost + p.tax) continue;
      if (s.forbidExpensive && cost >= s.forbidExpensive) continue;
      if (p.noAbilities > 0) continue;
      if (ab.needArtifacts && p.hand.length < ab.needArtifacts) continue;
      if (hasShieldOp(def) && shieldCardsFull(p)) continue;
      var needT = needsTarget(def);
      if (needT && weak === null) continue;
      var sc = scoreOps(def.ops || [], s, p, needT ? weak : null);
      var value = sc / Math.max(1, cost);
      out.push({
        action: 'ability',
        picks: { ability: j, mode: variants[v].mode, target: needT ? weak : null },
        score: value
      });
    }
  }

  for (var k = 0; k < p.hand.length; k++) {
    var art = artifactById(p.hand[k]);
    var pay = art.world !== p.world ? art.cost : 0;
    if (p.mental < pay) continue;
    if (p.noArtifacts > 0) continue;
    if (hasShieldOp(art) && shieldCardsFull(p)) continue;
    var needA = needsTarget(art);
    if (needA && weak === null) continue;
    var scA = scoreOps(art.ops, s, p, needA ? weak : null);
    out.push({
      action: 'useArtifact',
      picks: { artifact: k, target: needA ? weak : null },
      score: scA / Math.max(1, pay + 1)
    });

    var manaGap = p.maxMana - p.mana;
    if (manaGap > 0) {
      out.push({
        action: 'exchange',
        picks: { artifact: k, mode: 0 },
        score: Math.min(art.trade, manaGap) * 0.9
      });
    }
    var nextCard = nextExchangeCard(p);
    if (nextCard && p.abilities.length < p.handLimit) {
      var cv = scoreOps(nextCard.ops || [], s, p, weak) / Math.max(1, nextCard.cost);
      out.push({ action: 'exchange', picks: { artifact: k, mode: 1 }, score: cv * 0.85 });
    }
  }

  if (p.charId === 'zhulien' && p.noAttack === 0) {
    var nbS = neighbors(s, p.idx);
    for (var si2 = 0; si2 < nbS.length; si2++) {
      if (s.players[nbS[si2]].hand.length) {
        out.push({ action: 'attack', picks: { target: nbS[si2], steal: true }, score: 3.0 });
      }
    }
  }
  if (p.charId === 'mirai' && !p.passiveUsed.trade) {
    for (var mi = 0; mi < s.players.length; mi++) {
      if (mi === p.idx || !s.players[mi].alive || !s.players[mi].hand.length) continue;
      out.push({ action: 'trade', picks: { target: mi }, score: 2.2 });
    }
  }
  if (p.charId === 'glyuk' && !p.abilities.length && !p.passiveUsed.restore) {
    out.push({ action: 'restore', picks: {}, score: 3.5 });
  }
  if ((s.deck.length || s.oldDiscard.length || s.newDiscard.length) && p.hand.length < p.artifactLimit) out.push({ action: 'take', picks: {}, score: 1.2 });
  return out;
}

function pickBest(list) {
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
}

function comboMove(s, p) {
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
}

function botMove(s, noise) {
  if (s.phase !== 'main') return null;
  var p = me(s);

  if (p.comboMode) {
    var comboPick = comboMove(s, p);
    if (comboPick) return comboPick;
  }

  /* копящий стиль: сначала набивает руку артефактами, потом играет как обычно */
  if ((p.style === 'hoarder' && p.hand.length < p.artifactLimit) ||
      (p.style === 'hoarder3' && p.hand.length < 3)) {
    var hoardList = candidates(s, p);
    var takes = hoardList.filter(function (c) { return c.action === 'take'; });
    if (takes.length) return pickBest(takes);
  }

  /* цикл: копит до пяти, играет обычным стилем, пока не останется одна карта */
  if (p.style === 'cycle5') {
    if (p.hoardMode === undefined) p.hoardMode = true;
    if (p.hoardMode && p.hand.length >= 5) p.hoardMode = false;
    if (!p.hoardMode && p.hand.length <= 1) p.hoardMode = true;
    if (p.hoardMode) {
      var c5list = candidates(s, p);
      var c5takes = c5list.filter(function (c) { return c.action === 'take'; });
      if (c5takes.length) return pickBest(c5takes);
    }
  }

  if (s.priority) return priorityMove(s, p);
  var list = candidates(s, p);
  if (!list.length) return { action: 'pass', picks: {}, score: 0 };
  var best = list[0];
  for (var i = 1; i < list.length; i++) {
    if (list[i].score > best.score) best = list[i];
  }
  if (noise && rand(s) < noise && list.length > 1) {
    var alt = list[Math.floor(rand(s) * list.length)];
    return alt;
  }
  return best;
}

function botPickChoice(s, p) {
  var best = null;
  var bestVal = -Infinity;
  for (var i = 0; i < p.pool.length; i++) {
    var ab = p.pool[i];
    var defs = ab.modes ? ab.modes : [ab];
    for (var d = 0; d < defs.length; d++) {
      var sc = scoreOps(defs[d].ops || [], s, p, pickWeakest(s, p.idx, -1));
      var val = sc / Math.max(1, defs[d].cost === undefined ? ab.cost : defs[d].cost);
      if (val > bestVal) { bestVal = val; best = ab.id; }
    }
  }
  return best;
}

function runBotsPick(s, humanIdx) {
  var guard = 0;
  while (s.phase === 'pick' && guard++ < 200) {
    var who = s.pickOrder[s.pickIndex];
    if (who === humanIdx) break;
    var choice = botPickChoice(s, s.players[who]);
    if (!choice) break;
    var r = pickAbility(s, choice);
    if (!r.ok) break;
  }
  return [];
}

/* ---------- текст ---------- */

function statusText(s) {
  var p = me(s);
  if (s.phase === 'over') {
    return s.winner === null ? 'Партия окончена, все выбыли.' : 'Партия окончена, победил ' + s.players[s.winner].name + '.';
  }
  var parts = [];
  parts.push('Ваш ход, круг ' + s.round + '. Вы ' + p.name + '.');
  parts.push('Здоровье ' + p.hp + ' из ' + p.maxHp + '.');
  parts.push('Менталка ' + p.mental + ' из ' + p.maxMental + '. Энергия ' + p.mana + ' из ' + p.maxMana + '.');
  var others = [];
  for (var i = 0; i < s.players.length; i++) {
    var q = s.players[i];
    if (i === p.idx) continue;
    others.push(q.alive ? q.name + ': ' + q.hp + ' из ' + q.maxHp : q.name + ': выбыл');
  }
  parts.push('Остальные — ' + others.join('; ') + '.');
  parts.push('Артефактов в руке: ' + p.hand.length + '.');
  parts.push(p.abilities.length ? 'Способности: ' + p.abilities.map(function (a) { return a.name + ' за ' + a.cost; }).join('; ') + '.' : 'Способностей в руке нет.');
  return parts.join(' ');
}

module.exports = {
  newGame: newGame,
  apply: apply,
  nextStep: nextStep,
  botMove: botMove,
  candidates: candidates,
  isOver: isOver,
  me: me,
  statusText: statusText,
  playerTargets: playerTargets,
  neighbors: neighbors,
  pickOptions: pickOptions,
  pickOwner: pickOwner,
  pickAbility: pickAbility,
  runBotsPick: runBotsPick,
  abilityOptions: abilityOptions,
  charById: charById,
  artifactById: artifactById,
  abilityById: abilityById,
  WORLD_LIST: D.WORLDS,
  ARCHETYPE_LIST: D.ARCHETYPES
};
