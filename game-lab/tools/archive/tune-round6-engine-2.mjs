import fs from 'node:fs';

const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

function rep(old, neu, label) {
  if (!e.includes(old)) throw new Error('не найдено: ' + label);
  e = e.replace(old, neu);
  console.log('ok: ' + label);
}

/* 1. Боря: снижение получаемого урона, минимум единица */
rep(`  /* Боря: за каждые две недостающие от максимума энергии получает на единицу больше */
  if (t.charId === 'borya') {
    var missB = Math.max(0, t.maxMana - t.mana);
    dmg = dmg + Math.floor(missB / 2);
  }`,
    `  /* Боря: за каждые две недостающие от максимума энергии получает на единицу меньше, но не меньше одной */
  if (t.charId === 'borya') {
    var missB = Math.max(0, t.maxMana - t.mana);
    dmg = Math.max(1, dmg - Math.floor(missB / 2));
  }`,
    'Боря: снижение урона');

/* 2. Боря: прибавка к своей атаке больше не действует */
rep(`    var dmgVal = p.dmg + p.buff;
    if (p.charId === 'borya') {
      var missB = Math.max(0, p.maxMana - p.mana);
      dmgVal += Math.floor(missB / 2);
    }`,
    `    var dmgVal = p.dmg + p.buff;`,
    'Боря: прибавка к атаке убрана');

/* 3. Омнис берёт два артефакта */
rep(`    if (!s.deck.length) return { ok: false, text: 'Колода пуста.' };
    var got = s.deck.shift();
    p.hand.push(got);
    events.push(p.name + ' берёт артефакт.');`,
    `    var takeCount = p.charId === 'omnis' ? 2 : 1;
    var gotAny = 0;
    for (var tk = 0; tk < takeCount && p.hand.length < p.artifactLimit; tk++) {
      if (!s.deck.length) reshuffleDeck(s, events);
      if (!s.deck.length) break;
      p.hand.push(s.deck.shift());
      gotAny++;
    }
    if (!gotAny) return { ok: false, text: 'Колода пуста.' };
    events.push(p.name + ' берёт артефактов: ' + gotAny + '.');`,
    'Омнис: два артефакта за действие');

/* 4. Новая операция: сброс половины артефактов с округлением вверх */
rep(`      case 'discardAllArtifacts':`,
    `      case 'discardHalfArtifacts':
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

      case 'discardAllArtifacts':`,
    'операция: половина артефактов');

/* 5. Оценка ботом новой операции */
rep(`    if (t === 'stealArtifact' || t === 'discardArtifact' || t === 'discardAllArtifacts' || t === 'noArtifacts') {`,
    `    if (t === 'stealArtifact' || t === 'discardArtifact' || t === 'discardAllArtifacts' || t === 'discardHalfArtifacts' || t === 'noArtifacts') {`,
    'бот: оценка половины артефактов');

fs.writeFileSync(ep, e, 'utf8');
console.log('движок обновлён');
