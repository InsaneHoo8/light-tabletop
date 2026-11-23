import fs from 'node:fs';

const path = 'game-lab/arena/engine.js';
let src = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

function rep(old, neu, label) {
  if (!src.includes(old)) throw new Error('не найдено: ' + label);
  src = src.replace(old, neu);
  console.log('ok: ' + label);
}

/* 1. Лечение снимает дебаф отложенного урона */
rep(
  `      case 'heal':
        for (var h = 0; h < targets.length; h++) {
          var th = s.players[targets[h]];
          if (!th.alive) continue;
          var healAmount = amount;
          if (op.lowHp !== undefined && th.hp <= op.lowHp) healAmount = op.lowN;
          var beforeH = th.hp;
          th.hp = Math.min(th.maxHp, th.hp + healAmount);
          events.push(th.name + ' восстанавливает ' + (th.hp - beforeH) + ', теперь ' + th.hp + '.');
        }
        break;`,
  `      case 'heal':
        for (var h = 0; h < targets.length; h++) {
          var th = s.players[targets[h]];
          if (!th.alive) continue;
          var healAmount = amount;
          if (op.lowHp !== undefined && th.hp <= op.lowHp) healAmount = op.lowN;
          var beforeH = th.hp;
          th.hp = Math.min(th.maxHp, th.hp + healAmount);
          events.push(th.name + ' восстанавливает ' + (th.hp - beforeH) + ', теперь ' + th.hp + '.');
          if (th.dot > 0) {
            th.dot = 0;
            events.push('Отложенный урон снят лечением.');
          }
        }
        break;`,
  'лечение снимает дебаф'
);

/* 2. Отложенный урон срабатывает в конце хода носителя */
rep(
  `  var startP = s.players[s.turn];
  if (startP.dot > 0) {
    events.push('Отложенный урон по ' + startP.dat + '.');
    damage(s, s.turn, startP.dot, events, { pierce: true });
    startP.dot = 0;
    checkWinner(s);
  }`,
  `  var startP = s.players[s.turn];
  if (startP.dotStart) {
    startP.dotStart = false;
    startP.dot = 0;
  }`,
  'убрал старое срабатывание'
);

rep(
  `function endTurn(s, events) {
  var p = me(s);`,
  `function endTurn(s, events) {
  var p = me(s);

  /* отложенный урон: если за ход не вылечились, дебаф бьёт в конце хода */
  if (p.dot > 0) {
    events.push('Отложенный урон по ' + p.dat + ' срабатывает.');
    damage(s, p.idx, p.dot, events, { pierce: true });
    p.dot = 0;
    checkWinner(s);
  }`,
  'отложенный урон в конце хода'
);

/* 3. Смертельный раж считает недостающее здоровье самого действующего */
rep(
  `      case 'dmgMissing':
        for (var m = 0; m < targets.length; m++) {
          var t0 = s.players[targets[m]];
          var missing = Math.max(0, t0.maxHp - t0.hp);
          var bonus = Math.floor(missing / op.per);
          damage(s, targets[m], op.base + bonus, events, { attacker: actor.idx });
        }
        break;`,
  `      case 'dmgMissing':
        var ownMissing = Math.max(0, actor.maxHp - actor.hp);
        var ownBonus = Math.floor(ownMissing / op.per);
        for (var m = 0; m < targets.length; m++) {
          damage(s, targets[m], op.base + ownBonus, events, { attacker: actor.idx });
        }
        break;`,
  'смертельный раж считает своё здоровье'
);

/* 4. Снижение урона действует от любых источников */
rep(
  `  if (dmg > 0 && t.reduce > 0 && !opts.pierce) {`,
  `  if (dmg > 0 && t.reduce > 0) {`,
  'снижение от всех источников'
);

/* 5. Разрушение щита может бить по всем */
rep(
  `      if (t.shield <= 0 && t.shieldPunish && opts.attacker !== undefined) {`,
  `      if (t.shield <= 0 && t.shieldAllPunish) {
        for (var sp = 0; sp < s.players.length; sp++) {
          var psp = s.players[sp];
          if (!psp.alive) continue;
          psp.mana = Math.max(0, psp.mana - t.shieldAllPunish);
        }
        events.push('Щит разрушен: все теряют по ' + t.shieldAllPunish + ' энергии.');
        t.shieldAllPunish = 0;
      }
      if (t.shield <= 0 && t.shieldPunish && opts.attacker !== undefined) {`,
  'щит с наказанием всем'
);

rep(
  `        if (op.punish) actor.shieldPunish = op.punish;`,
  `        if (op.punish) actor.shieldPunish = op.punish;
        if (op.punishAll) actor.shieldAllPunish = op.punishAll;`,
  'операция наказания всем'
);

rep(
  `    shieldPunish: 0,`,
  `    shieldPunish: 0,
    shieldAllPunish: 0,`,
  'поле наказания всем'
);

/* 6. Отложенный урон ставится как дебаф на цель */
rep(
  `      case 'dot':
        for (var dt = 0; dt < targets.length; dt++) s.players[targets[dt]].dot += op.n;
        events.push('Отложенный урон: ' + op.n + ' в начале следующего хода.');
        break;`,
  `      case 'dot':
        for (var dt = 0; dt < targets.length; dt++) {
          s.players[targets[dt]].dot = Math.max(s.players[targets[dt]].dot, op.n);
        }
        events.push('Дебаф: ' + op.n + ' урона в конце хода цели, если не вылечится.');
        break;`,
  'дебаф отложенного урона'
);

fs.writeFileSync(path, src, 'utf8');
console.log('движок обновлён');
