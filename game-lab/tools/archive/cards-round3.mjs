import fs from 'node:fs';

/* --- движок: условный сброс или урон --- */
const epath = 'game-lab/arena/engine.js';
let e = fs.readFileSync(epath, 'utf8').replace(/\r\n/g, '\n');

if (!e.includes("case 'discardOrDamage'")) {
  e = e.replace(
    `      case 'discardAbility':`,
    `      case 'discardOrDamage':
        for (var dod = 0; dod < targets.length; dod++) {
          var tdod = s.players[targets[dod]];
          var hadSomething = false;
          if (tdod.abilities.length) {
            var lostD = tdod.abilities.splice(Math.floor(rand(s) * tdod.abilities.length), 1)[0];
            pileAfterUse(tdod, lostD);
            events.push(tdod.name + ' теряет способность «' + lostD.name + '».');
            hadSomething = true;
          }
          if (tdod.hand.length) {
            var cardD = tdod.hand.splice(Math.floor(rand(s) * tdod.hand.length), 1)[0];
            s.discard.push(cardD);
            events.push(tdod.name + ' сбрасывает ' + artifactById(cardD).name + '.');
            hadSomething = true;
          }
          if (!hadSomething) {
            damage(s, targets[dod], op.n, events, { attacker: actor.idx });
          }
        }
        break;

      case 'discardAbility':`
  );
  fs.writeFileSync(epath, e, 'utf8');
  console.log('движок: сброс или урон');
}

/* --- карты --- */
const path = 'game-lab/arena/cards.js';
let src = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

function byName(name, literal) {
  const at = src.indexOf(`name: '${name}'`);
  if (at < 0) throw new Error('нет карты: ' + name);
  const start = src.lastIndexOf('{', at);
  let depth = 0;
  let end = start;
  for (let i = start; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  src = src.slice(0, start) + literal + src.slice(end);
}

function setHp(id, value) {
  const at = src.indexOf(`id: '${id}'`);
  const end = src.indexOf('abilities: [', at);
  let block = src.slice(at, end);
  block = block.replace(/hp: \d+/, 'hp: ' + value);
  src = src.slice(0, at) + block + src.slice(end);
}

setHp('hrom', 26);

byName('Выстрел из пушки судного дня', "{ id: 'sudnyi', name: 'Выстрел из пушки судного дня', cost: 3, target: true, desc: 'пять урона цели, игнорируя щиты', ops: [{ t: 'dmg', who: 'target', n: 5, pierce: true }] }");
byName('Система самовосстановления', "{ id: 'samovosstanovlenie', name: 'Система самовосстановления', cost: 1, desc: 'восстанавливает четыре здоровья', ops: [{ t: 'heal', who: 'self', n: 4 }] }");
byName('Хмельной барьер', "{ id: 'barrier', name: 'Хмельной барьер', cost: 2, desc: 'пять щита; пока он держится, при получении урона любая цель получает один урон', ops: [{ t: 'shield', n: 5, retal: 1 }] }");
byName('Запойный вихрь', "{ id: 'vihr', name: 'Запойный вихрь', cost: 4, desc: 'по четыре урона всем остальным и три энергии себе', ops: [{ t: 'dmg', who: 'others', n: 4 }, { t: 'energy', who: 'self', n: 3 }] }");
byName('Системный аудит', "{ id: 'audit', name: 'Системный аудит', cost: 1, target: true, desc: 'цель теряет одну менталку; вы видите её артефакты, а если их нет — способности', ops: [{ t: 'mental', who: 'target', n: -1 }, { t: 'look', who: 'target' }] }");
byName('Донатный щит', "{ id: 'donat', name: 'Донатный щит', cost: 2, desc: 'шесть щита, если в руке есть артефакт, иначе три', ops: [{ t: 'shield', n: 6, lessIfNoArtifact: 3 }] }");
byName('Противоосколочный протокол', "{ id: 'protivooskol', name: 'Противоосколочный протокол', cost: 2, desc: 'снижает любой получаемый урон на четыре на два хода, но не ниже одной единицы', ops: [{ t: 'dmgReduce', n: 4, turns: 2 }] }");
byName('Троллья регенерация', "{ id: 'regeneraciya', name: 'Троллья регенерация', cost: 2, desc: 'восстанавливает четыре здоровья, а при четырнадцати и меньше — восемь', ops: [{ t: 'heal', who: 'self', n: 4, lowHp: 14, lowN: 8 }] }");
byName('Кровавая ярость', "{ id: 'krovavaya', name: 'Кровавая ярость', cost: 1, desc: 'теряете два здоровья; на следующем ходу любой ваш урон больше на три', ops: [{ t: 'dmg', who: 'self', n: 2, pierce: true }, { t: 'buff', n: 3, anyTarget: true }] }");
byName('Окаменение кожи', "{ id: 'okamenenie', name: 'Окаменение кожи', cost: 1, desc: 'пять щита; пока держится, весь урон снижается на один', ops: [{ t: 'shield', n: 5, reduce: 1 }] }");
byName('Перегрузка систем', "{ id: 'peregruzka', name: 'Перегрузка систем', cost: 2, target: true, desc: 'цель пропускает свой следующий ход', ops: [{ t: 'skip', who: 'target' }] }");
byName('Аналитический скан', "{ id: 'scan', name: 'Аналитический скан', cost: 1, target: true, desc: 'цель теряет две менталки; вы видите и артефакты, и способности цели', ops: [{ t: 'mental', who: 'target', n: -2 }, { t: 'look', who: 'target' }] }");
byName('Энергетический перелив', "{ id: 'pereliv', name: 'Энергетический перелив', cost: 0, desc: 'две менталки в три энергии или две энергии в три менталки, плюс дополнительное действие', modes: [{ label: 'менталка в энергию', cost: 0, ops: [{ t: 'mental', who: 'self', n: -2 }, { t: 'energy', who: 'self', n: 3 }, { t: 'extraAction', n: 1 }] }, { label: 'энергия в менталку', cost: 0, ops: [{ t: 'energy', who: 'self', n: -2 }, { t: 'mental', who: 'self', n: 3 }, { t: 'extraAction', n: 1 }] }] }");
byName('Отравленная игла', "{ id: 'igla', name: 'Отравленная игла', cost: 2, target: true, desc: 'два урона сразу и три в конце следующего хода цели, если она не вылечится', ops: [{ t: 'dmg', who: 'target', n: 2 }, { t: 'dot', who: 'target', n: 3 }] }");
byName('Фаервол', "{ id: 'faervol', name: 'Фаервол', cost: 2, desc: 'пять щита; когда щит разрушают, все игроки теряют по одной энергии', ops: [{ t: 'shield', n: 5, punishAll: 1 }] }");
byName('Перегрузка нейросети', "{ id: 'peregruzka', name: 'Перегрузка нейросети', cost: 3, target: true, desc: 'пять урона цели и минус две менталки', ops: [{ t: 'dmg', who: 'target', n: 5 }, { t: 'mental', who: 'target', n: -2 }] }");
byName('DDOS атака', "{ id: 'ddos', name: 'DDOS атака', cost: 3, desc: 'все остальные получают по четыре урона и теряют по две энергии', ops: [{ t: 'dmg', who: 'others', n: 4 }, { t: 'energy', who: 'others', n: -2 }] }");
byName('Системный сбой', "{ id: 'sboi', name: 'Системный сбой', cost: 4, desc: 'по три урона всем остальным и дополнительное действие', ops: [{ t: 'dmg', who: 'others', n: 3 }, { t: 'extraAction', n: 1 }] }");
byName('Мирный договор', "{ id: 'mirny', name: 'Мирный договор', cost: 1, target: true, desc: 'цель не может атаковать вас на своём ходу, а вы не можете бить её на следующем своём', ops: [{ t: 'noAttack', who: 'target' }] }");
byName('Бюрократический ад', "{ id: 'byurokrat', name: 'Бюрократический ад', cost: 2, target: true, desc: 'цель сбрасывает способность и артефакт, а если у неё их нет — получает четыре урона', ops: [{ t: 'discardOrDamage', who: 'target', n: 4 }] }");
byName('Налог на агрессию', "{ id: 'nalog', name: 'Налог на агрессию', cost: 2, target: true, desc: 'до вашего следующего хода цель платит больше, а её обычная атака слабее на единицу', ops: [{ t: 'tax', who: 'target' }, { t: 'weaken', who: 'target', n: 1 }] }");
byName('Гуманитарная помощь', "{ id: 'pomoshch', name: 'Гуманитарная помощь', cost: 1, target: true, desc: 'четыре здоровья себе и по одному всем остальным', ops: [{ t: 'heal', who: 'self', n: 4 }, { t: 'heal', who: 'others', n: 1 }] }");

fs.writeFileSync(path, src, 'utf8');
console.log('карты обновлены');
