import fs from 'node:fs';

const path = 'game-lab/arena/engine.js';
let src = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

function rep(old, neu, label) {
  if (!src.includes(old)) throw new Error('не найдено: ' + label);
  src = src.replace(old, neu);
  console.log('ok: ' + label);
}

/* ---------- поля игрока: ёмкость щита, карты щита, счётчики пассивок ---------- */
rep(
  `    shield: 0,`,
  `    shieldCap: ch.shieldCap || 5,
    shield: 0,
    shieldCards: [],
    passiveUsed: {},`,
  'поля щита'
);

/* ---------- бот: запасной вариант, чтобы не падал ---------- */
/* ---------- урон: пассивки Григория, Бори, Грога ---------- */
rep(
  `  var dmg = amount;`,
  `  var dmg = amount;

  /* Григорий: три артефакта в руке — получает на единицу меньше */
  if (t.charId === 'grigori' && t.hand.length >= 3) {
    dmg = Math.max(1, dmg - 1);
  }
  /* Грог: при восьми здоровья и меньше получает на единицу больше */
  if (t.charId === 'grog' && t.hp <= 8) {
    dmg = dmg + 1;
  }
  /* Боря: за каждые две недостающие энергии получает на единицу больше */
  if (t.charId === 'borya') {
    var missE = Math.max(0, t.maxMana - t.mana);
    dmg = dmg + Math.floor(missE / 2);
  }`,
  'урон с пассивками'
);

/* ---------- обычная атака: пассивки Бори и Григория ---------- */
rep(
  `    var dmgVal = p.dmg + p.buff;
    if (p.weakened) dmgVal = Math.max(1, dmgVal - p.weakened);`,
  `    var dmgVal = p.dmg + p.buff;
    if (p.charId === 'borya') {
      var missB = Math.max(0, p.maxMana - p.mana);
      dmgVal += Math.floor(missB / 2);
    }
    if (p.charId === 'grigori' && p.hand.length >= 1) dmgVal += 1;
    if (p.charId === 'grog' && p.hp <= 8) dmgVal += 1;
    if (p.weakened) dmgVal = Math.max(1, dmgVal - p.weakened);`,
  'атака с пассивками'
);

/* ---------- стоимость способностей: Грог, Хром ---------- */
rep(
  `    var totalCost = cost + (p.tax || 0);`,
  `    var totalCost = cost + (p.tax || 0);
    if (p.charId === 'grog' && p.hp <= 20) totalCost = Math.max(0, totalCost - 1);
    if (p.charId === 'hrom' && p.shield > 0) totalCost = Math.max(0, totalCost - 1);`,
  'скидка на способности'
);

/* ---------- цена артефактов: Омнис, Хром ---------- */
rep(
  `    var payMental = art.world !== p.world ? art.cost : 0;`,
  `    var payMental = art.world !== p.world ? art.cost : 0;
    if (p.charId === 'omnis' && payMental > 0) payMental = Math.max(0, payMental - 1);
    if (p.charId === 'hrom' && p.shield > 0 && payMental > 0) payMental = Math.max(0, payMental - 1);`,
  'скидка на артефакты'
);

/* ---------- лечение: Грог, Григорий ---------- */
rep(
  `          var healAmount = amount;
          if (op.lowHp !== undefined && th.hp <= op.lowHp) healAmount = op.lowN;`,
  `          var healAmount = amount;
          if (op.lowHp !== undefined && th.hp <= op.lowHp) healAmount = op.lowN;
          if (th.charId === 'grog' && th.hp <= 16) healAmount += 1;
          if (th.charId === 'grigori' && th.hand.length >= 2) healAmount += 1;`,
  'лечение с пассивками'
);

/* ---------- Люся: урон по нескольким целям даёт ресурсы ---------- */
rep(
  `          if (op.leech && dealt > 0) {`,
  `          if (actor.charId === 'lyusya' && targets.length > 1 && dealt > 0) {
            actor.mental = Math.min(actor.maxMental, actor.mental + 1);
            actor.mana = Math.min(actor.maxMana, actor.mana + 1);
            actor.hp = Math.min(actor.maxHp, actor.hp + 1);
            events.push('Хайп: Люся получает по единице ресурсов.');
          }
          if (op.leech && dealt > 0) {`,
  'пассивка Люси'
);

/* ---------- щит: карты и потолок ---------- */
rep(
  `      case 'shield':
        var shieldVal = amount;
        if (op.lessIfNoArtifact !== undefined && !actor.hand.length) shieldVal = op.lessIfNoArtifact;
        actor.shield = Math.max(actor.shield, shieldVal);
        actor.shieldForever = !!op.forever;
        if (op.punish) actor.shieldPunish = op.punish;
        if (op.punishAll) actor.shieldAllPunish = op.punishAll;
        if (op.reduce) actor.reduce = Math.max(actor.reduce, op.reduce);
        events.push('Щит ' + actor.gen + ': ' + actor.shield + '.');
        break;`,
  `      case 'shield':
        var shieldVal = amount;
        if (op.lessIfNoArtifact !== undefined && !actor.hand.length) shieldVal = op.lessIfNoArtifact;
        if (actor.charId === 'grigori' && actor.hand.length >= 2) shieldVal += 1;

        var maxCards = actor.charId === 'heil' ? 2 : 1;
        var cards = actor.shieldCards;
        if (cards.length >= maxCards) {
          /* новый щит заменяет самый слабый */
          cards.sort(function (a, b) { return a.value - b.value; });
          var dropped = cards.shift();
          events.push('Щит заменён, прежний снят: ' + dropped.value + '.');
          actor.shield -= dropped.value;
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
        break;`,
  'щит как карты'
);

/* ---------- щит ломается: карты в сброс ---------- */
rep(
  `      if (t.shield <= 0 && t.shieldAllPunish) {`,
  `      if (t.shield <= 0 && t.shieldCards.length) {
        t.shieldCards = [];
        events.push('Щит ' + t.gen + ' разрушен, карта уходит в сброс.');
      }
      if (t.shield <= 0 && t.shieldAllPunish) {`,
  'сброс карт щита'
);

fs.writeFileSync(path, src, 'utf8');
console.log('движок: пассивки и щит');
