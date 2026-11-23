import fs from 'node:fs';

const path = 'game-lab/arena/engine.js';
let src = fs.readFileSync(path, 'utf8');

function rep(old, neu, label) {
  if (!src.includes(old)) throw new Error('не найдено: ' + label);
  src = src.replace(old, neu);
  console.log('ok: ' + label);
}

/* 1. Щиты живут до разрушения: убираем снятие щита в начале хода */
rep(
  `  /* щит и защита живут до начала следующего хода владельца */
  var nextP = s.players[s.turn];
  if (!nextP.shieldForever) nextP.shield = 0;
  nextP.shieldForever = false;
  nextP.reduce = 0;`,
  `  /* щит держится до разрушения, снижение урона живёт ограниченное число ходов */
  var nextP = s.players[s.turn];
  if (nextP.reduceTurns > 0) {
    nextP.reduceTurns--;
    if (nextP.reduceTurns === 0) nextP.reduce = 0;
  }`,
  'щит до разрушения'
);

/* 2. Снижение урона с полом в единицу */
rep(
  `  if (dmg > 0 && t.reduce > 0 && !opts.pierce) {
    var cut = Math.min(t.reduce, dmg);
    dmg -= cut;
    events.push('Защита ' + t.gen + ' гасит ' + cut + '.');
  }`,
  `  if (dmg > 0 && t.reduce > 0 && !opts.pierce) {
    var cut = Math.min(t.reduce, dmg);
    dmg = Math.max(1, dmg - cut);
    events.push('Защита ' + t.gen + ' гасит ' + cut + '.');
  }`,
  'снижение урона до единицы'
);

/* 3. Поле ходов снижения у игрока */
rep(
  `    reduce: 0,`,
  `    reduce: 0,
    reduceTurns: 0,`,
  'поле ходов снижения'
);

/* 4. Операция снижения урона задаёт число ходов */
rep(
  `      case 'dmgReduce':
        actor.reduce = Math.max(actor.reduce, op.n);
        events.push('Получаемый урон снижен на ' + op.n + '.');
        break;`,
  `      case 'dmgReduce':
        actor.reduce = Math.max(actor.reduce, op.n);
        actor.reduceTurns = Math.max(actor.reduceTurns, op.turns || 1);
        events.push('Получаемый урон снижен на ' + op.n + ' на ' + (op.turns || 1) + ' хода.');
        break;`,
  'длительность снижения'
);

/* 5. Парирование: полный разворот урона */
rep(
  `    if (ab.id === 'parirovanie') {
      var reduced = Math.max(0, amount - 4);
      if (opts.attacker !== undefined) {
        events.push('Парирование: два урона в ответ.');
        damage(s, opts.attacker, 2, events, { pierce: true });
      }
      return reduced;
    }`,
  `    if (ab.id === 'parirovanie') {
      if (opts.attacker !== undefined) {
        events.push('Парирование: весь удар возвращается нападающему.');
        damage(s, opts.attacker, amount, events, { pierce: true });
      }
      return 0;
    }`,
  'парирование разворачивает урон'
);

/* 6. Порог золотого парашюта */
rep(`    if (ab.id === 'parashyut' && v.hp > 7) continue;`, `    if (ab.id === 'parashyut' && v.hp > 10) continue;`, 'порог парашюта');

/* 7. Новые операции: сброс всех артефактов и запрет дорогих карт по типам */
rep(
  `      case 'forbidExpensive':
        s.forbidExpensive = op.n;
        events.push('Дорогие карты запрещены до вашего следующего хода.');
        break;`,
  `      case 'forbidExpensive':
        s.forbidExpensive = op.n;
        events.push('Дорогие карты запрещены до вашего следующего хода.');
        break;

      case 'forbidBig':
        s.forbidAbilityMin = op.abilityMin || 0;
        s.forbidArtifactMin = op.artifactMin || 0;
        events.push('Запрет: способности от ' + s.forbidAbilityMin + ', артефакты от ' + s.forbidArtifactMin + '.');
        break;

      case 'discardAllArtifacts':
        for (var dla = 0; dla < targets.length; dla++) {
          var tdla = s.players[targets[dla]];
          while (tdla.hand.length) s.discard.push(tdla.hand.pop());
          events.push(tdla.name + ' сбрасывает все артефакты.');
        }
        break;

      case 'attackNeighbor':
        for (var anb = 0; anb < targets.length; anb++) {
          var tanb = s.players[targets[anb]];
          tanb.forceAttack = actor.idx;
        }
        events.push('Цель обязана ударить соседа.');
        break;`,
  'новые операции'
);

/* 8. Запрет по типам в применении карт */
rep(
  `    if (s.forbidExpensive && cost >= s.forbidExpensive) return { ok: false, text: 'Запретительный указ: карта слишком дорогая.' };`,
  `    if (s.forbidExpensive && cost >= s.forbidExpensive) return { ok: false, text: 'Запретительный указ: карта слишком дорогая.' };
    if (s.forbidAbilityMin && cost >= s.forbidAbilityMin) return { ok: false, text: 'Способности такой стоимости запрещены.' };`,
  'запрет способностей по цене'
);

rep(
  `    var payMental = art.world !== p.world ? art.cost : 0;
    if (p.mental < payMental) return { ok: false, text: 'Не хватает менталки: нужно ' + payMental + '.' };`,
  `    var payMental = art.world !== p.world ? art.cost : 0;
    if (s.forbidArtifactMin && art.cost >= s.forbidArtifactMin) return { ok: false, text: 'Артефакты такой цены запрещены.' };
    if (p.mental < payMental) return { ok: false, text: 'Не хватает менталки: нужно ' + payMental + '.' };`,
  'запрет артефактов по цене'
);

/* 9. Сброс запретов в начале своего хода */
rep(
  `  p.marked = 0;`,
  `  p.marked = 0;
  s.forbidExpensive = 0;
  s.forbidAbilityMin = 0;
  s.forbidArtifactMin = 0;`,
  'снятие запретов'
);

fs.writeFileSync(path, src, 'utf8');
console.log('движок обновлён');
