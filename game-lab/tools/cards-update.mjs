import fs from 'node:fs';

const path = 'game-lab/arena/cards.js';
let src = fs.readFileSync(path, 'utf8');

const NEW = {
  /* Хром */
  overdrive: "{ id: 'overdrive', name: 'Овердрайв', cost: 1, desc: 'на следующем ходу добавляет две единицы к урону атаки или боевой способности', ops: [{ t: 'buff', n: 2 }] }",
  samovosstanovlenie: "{ id: 'samovosstanovlenie', name: 'Система самовосстановления', cost: 2, desc: 'восстанавливает четыре здоровья', ops: [{ t: 'heal', who: 'self', n: 4 }] }",
  stena: "{ id: 'stena', name: 'Защитный протокол «Стена»', cost: 1, desc: 'поглощает три урона только от способностей и артефактов', ops: [{ t: 'dmgReduce', n: 3 }] }",
  hladagent: "{ id: 'hladagent', name: 'Выброс хладагента', cost: 1, desc: 'снимает пропуск хода, бьёт по два урона обоим соседям', ops: [{ t: 'purge' }, { t: 'dmg', who: 'neighbors', n: 2 }] }",

  /* Жюльен */
  ispodtishka: "{ id: 'ispodtishka', name: 'Удар исподтишка', cost: 3, target: true, desc: 'если у цели есть щит — два урона сквозь щит и три по щиту, иначе пять урона', ops: [{ t: 'shieldBreaker', who: 'target', through: 2, toShield: 3, plain: 5 }] }",
  parirovanie: "{ id: 'parirovanie', name: 'Парирование рапирой', cost: 2, reaction: true, desc: 'реакция: полностью отменяет входящий удар и возвращает весь урон нападающему', ops: [] }",
  dymovaya: "{ id: 'dymovaya', name: 'Дымовая шашка', cost: 2, desc: 'до вашего следующего хода вас нельзя бить атакой и способностями, снимает контроль и даёт дополнительное действие', ops: [{ t: 'purge' }, { t: 'extraAction', n: 1 }] }",
  igla: "{ id: 'igla', name: 'Отравленная игла', cost: 2, target: true, desc: 'цель получает три урона в начале своего следующего хода', ops: [{ t: 'dot', who: 'target', n: 3 }] }",
  luk: "{ id: 'luk', name: 'Выстрел из лука', cost: 4, target: true, desc: 'восемь урона любой цели без правила соседей', ops: [{ t: 'dmg', who: 'target', n: 8 }] }",

  /* Эт’Кора */
  psi: "{ id: 'psi', name: 'Психический всплеск', cost: 2, target: true, desc: 'три урона менталке цели, два здоровью и кража одной способности', ops: [{ t: 'mental', who: 'target', n: -3 }, { t: 'dmg', who: 'target', n: 2 }, { t: 'stealAbility', who: 'target', n: 1 }] }",
  astral: "{ id: 'astral', name: 'Астральный разрыв', cost: 3, target: true, desc: 'урон равен недостающей менталке плюс три, не больше семи', ops: [{ t: 'dmgMissingMental', who: 'target', bonus: 3, max: 7 }] }",

  /* Грог */
  regeneraciya: "{ id: 'regeneraciya', name: 'Троллья регенерация', cost: 2, desc: 'восстанавливает четыре здоровья, а при двенадцати и меньше — восемь', ops: [{ t: 'heal', who: 'self', n: 4, lowHp: 12, lowN: 8 }] }",
  razmashistyi: "{ id: 'razmashistyi', name: 'Размашистый удар дубиной', cost: 2, desc: 'по четыре урона всем остальным игрокам', ops: [{ t: 'dmg', who: 'others', n: 4 }] }",
  rev: "{ id: 'rev', name: 'Обидчивый рёв', cost: 2, target: true, desc: 'цель на своём ходу обязана ударить Грога на единицу меньше и получает четыре урона', ops: [{ t: 'taunt', who: 'target', n: 4 }] }",

  /* Григорий */
  pomoshch: "{ id: 'pomoshch', name: 'Гуманитарная помощь', cost: 1, target: true, desc: 'три здоровья себе и по одному всем остальным', ops: [{ t: 'heal', who: 'self', n: 3 }, { t: 'heal', who: 'others', n: 1 }] }",
  mirny: "{ id: 'mirny', name: 'Мирный договор', cost: 1, target: true, desc: 'цель не может атаковать вас, а вы — её', ops: [{ t: 'noAttack', who: 'target' }] }",
  sankcii: "{ id: 'sankcii', name: 'Пакет санкций', cost: 2, target: true, desc: 'цель теряет две менталки, две энергии и не может применять артефакты', ops: [{ t: 'mental', who: 'target', n: -2 }, { t: 'energy', who: 'target', n: -2 }, { t: 'noArtifacts', who: 'target' }] }",
  ukaz: "{ id: 'ukaz', name: 'Запретительный указ', cost: 3, desc: 'до вашего следующего хода нельзя играть способности от двух энергии и артефакты от трёх менталки', ops: [{ t: 'forbidBig', abilityMin: 2, artifactMin: 3 }] }",

  /* Люся */
  otmena: "{ id: 'otmena', name: 'Отмена в прямом эфире', cost: 4, target: true, desc: 'пять урона, цель теряет всю менталку и сбрасывает все артефакты', ops: [{ t: 'dmg', who: 'target', n: 5 }, { t: 'mental', who: 'target', n: -99 }, { t: 'discardAllArtifacts', who: 'target' }] }",
  strim: "{ id: 'strim', name: 'Стрим на миллион', cost: 2, desc: 'все остальные теряют по две энергии и по две менталки', ops: [{ t: 'energy', who: 'others', n: -2 }, { t: 'mental', who: 'others', n: -2 }] }",
  klikbeyt: "{ id: 'klikbeyt', name: 'Кликбейт', cost: 1, target: true, desc: 'ваш сосед обязан на своём ходу ударить второго вашего соседа, но не вас', ops: [{ t: 'attackNeighbor' }] }",
  ohota: "{ id: 'ohota', name: 'Охота за лайками', cost: 2, desc: 'по два урона всем остальным, лечение на весь нанесённый урон', ops: [{ t: 'dmg', who: 'others', n: 2, leech: true }] }",

  /* Мирай */
  pogloshchenie: "{ id: 'pogloshchenie', name: 'Поглощение активов', cost: 2, target: true, desc: 'забирает случайный артефакт цели и лечит четыре здоровья', ops: [{ t: 'stealArtifact', who: 'target', n: 1 }, { t: 'heal', who: 'self', n: 4 }] }",

  /* Глюк */
  virus: "{ id: 'virus', name: 'Вирусная инъекция', cost: 2, target: true, desc: 'цель не может применять артефакты и способности до вашего следующего хода', ops: [{ t: 'noArtifacts', who: 'target' }, { t: 'noAbilities', who: 'target' }] }",
  ddos: "{ id: 'ddos', name: 'DDOS атака', cost: 3, desc: 'все остальные получают по три урона и теряют по две энергии', ops: [{ t: 'dmg', who: 'others', n: 3 }, { t: 'energy', who: 'others', n: -2 }] }",
  perezagruzka: "{ id: 'perezagruzka', name: 'Аварийная перезагрузка', cost: 1, desc: 'снимает контроль и запреты, даёт три энергии', ops: [{ t: 'purge' }, { t: 'energy', who: 'self', n: 3 }] }",

  /* Омнис */
  pereliv: "{ id: 'pereliv', name: 'Энергетический перелив', cost: 0, desc: 'обмен менталки на энергию или обратно, плюс дополнительное действие', modes: [{ label: 'менталка в энергию', cost: 0, ops: [{ t: 'mental', who: 'self', n: -3 }, { t: 'energy', who: 'self', n: 2 }, { t: 'extraAction', n: 1 }] }, { label: 'энергия в менталку', cost: 0, ops: [{ t: 'energy', who: 'self', n: -2 }, { t: 'mental', who: 'self', n: 3 }, { t: 'extraAction', n: 1 }] }] }",
  fazovyi: "{ id: 'fazovyi', name: 'Фазовый сдвиг', cost: 2, reaction: true, desc: 'реакция: полностью игнорирует входящий урон без затрат менталки', ops: [{ t: 'negate' }] }",
  veroyatnosti: "{ id: 'veroyatnosti', name: 'Вычисление вероятностей', cost: 1, desc: 'смотрит три верхних артефакта колоды, берёт два и один возвращает наверх', ops: [{ t: 'drawArtifact', n: 2 }, { t: 'lookDeck' }] }",

  /* Хейл */
  reaktor: "{ id: 'reaktor', name: 'Резервный реактор дредноута', cost: 0, desc: 'даёт три менталки и три энергии', ops: [{ t: 'mental', who: 'self', n: 3 }, { t: 'energy', who: 'self', n: 3 }] }",
  orbital: "{ id: 'orbital', name: 'Орбитальный залп', cost: 4, desc: 'по шесть урона всем остальным', ops: [{ t: 'dmg', who: 'others', n: 6 }] }",
  perenapravlenie: "{ id: 'perenapravlenie', name: 'Перенаправление щитов', cost: 2, desc: 'семь единиц щита до разрушения', ops: [{ t: 'shield', n: 7 }] }",
  protivooskol: "{ id: 'protivooskol', name: 'Противоосколочный протокол', cost: 2, desc: 'снижает получаемый урон на четыре на два хода, но не ниже одной единицы', ops: [{ t: 'dmgReduce', n: 4, turns: 2 }] }",
  peregruppirovka: "{ id: 'peregruppirovka', name: 'Тактическая перегруппировка', cost: 1, desc: 'снимает все негативные эффекты, включая пропуск хода, и лечит четыре здоровья', ops: [{ t: 'purge' }, { t: 'heal', who: 'self', n: 4 }] }",

  /* Безумный Маг */
  illyuzii: "{ id: 'illyuzii', name: 'Призыв Иллюзий', cost: 1, desc: 'четыре единицы щита', ops: [{ t: 'shield', n: 4 }] }",
  mutaciya: "{ id: 'mutaciya', name: 'Мутация', cost: 2, target: true, desc: 'либо цель бьёт на три меньше, либо вы получаете семь и прибавку к максимуму здоровья', modes: [{ label: 'ослабить цель', cost: 2, target: true, ops: [{ t: 'weaken', who: 'target', n: 3 }] }, { label: 'усилить себя', cost: 2, ops: [{ t: 'gainMaxHp', n: 7 }] }] }",
  proryv: "{ id: 'proryv', name: 'Научный прорыв', cost: 1, desc: 'три щита, две энергии, две менталки и дополнительное действие', ops: [{ t: 'shield', n: 3 }, { t: 'energy', who: 'self', n: 2 }, { t: 'mental', who: 'self', n: 2 }, { t: 'extraAction', n: 1 }] }"
};

let changed = 0;
for (const [id, literal] of Object.entries(NEW)) {
  const at = src.indexOf(`{ id: '${id}'`);
  if (at < 0) {
    console.log('не найдено: ' + id);
    continue;
  }
  let depth = 0;
  let end = at;
  for (let i = at; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  src = src.slice(0, at) + literal + src.slice(end);
  changed++;
}

fs.writeFileSync(path, src, 'utf8');
console.log('изменено способностей: ' + changed);
