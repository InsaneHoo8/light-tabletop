/* Данные игры по актуальным документам. Числа — единицы, как в документах.
   Способность: cost, target (нужна цель), reaction (реакция вне очереди),
   ops — список эффектов, modes — варианты выбора. */

var WORLDS = {
  fantasy: 'Королевства Раскола',
  cyber: 'Неонхейм',
  space: 'Звёздный Консорциум',
  earth404: 'Земля 404'
};

var CHARACTERS = [
  /* ---------------- Киберпанк ---------------- */
  {
    id: 'mirai', name: 'Мирай', full: 'Корпорат-манипулятор Мирай', gen: 'Мирай', acc: 'Мирай', dat: 'Мирай',
    world: 'cyber', hp: 25, dmg: 2, mental: 5, mana: 4, handLimit: 4, artifactLimit: 999, passive: 'Раз за ход меняется одним артефактом с любым игроком, не тратя действие. Сначала забирает артефакты киберпанка.', shieldCap: 5,
    text: 'Мирай — топ-менеджер совета директоров корпорации НеонТек, привыкшая превращать войну в прибыльный бизнес. Для неё поле боя — всего лишь открытый рынок с агрессивными конкурентами, которых проще обанкротить или натравить друг на друга, чем убивать лично.',
    abilities: [
      { id: 'podkup', name: 'Подкуп', cost: 2, target: true, desc: 'выбранная цель не может атаковать Мирай ни обычной атакой, ни способностями до своего следующего хода', ops: [{ t: 'noAttack', who: 'target' }, { t: 'noAbilities', who: 'target' }] },
      { id: 'kontrakt', name: 'Контракт на устранение', cost: 2, target: true, desc: 'метка на цели: любой, кто нанесёт ей урон до вашего следующего хода, восстановит три здоровья', ops: [{ t: 'mark', who: 'target', heal: 3 }] },
      { id: 'audit', name: 'Системный аудит', cost: 1, target: true, desc: 'цель теряет одну менталку; вы видите её артефакты, а если их нет — способности', ops: [{ t: 'mental', who: 'target', n: -1 }, { t: 'look', who: 'target' }] },
      { id: 'pogloshchenie', name: 'Поглощение активов', cost: 2, target: true, desc: 'забирает случайный артефакт цели и лечит четыре здоровья', ops: [{ t: 'stealArtifact', who: 'target', n: 1 }, { t: 'heal', who: 'self', n: 4 }] },
      { id: 'parashyut', name: 'Золотой парашют', cost: 2, reaction: true, desc: 'реакция: при получении урона с здоровьем семь и меньше урон отменяется, лечит пять и даёт четыре щита', ops: [{ t: 'negate' }, { t: 'heal', who: 'self', n: 5 }, { t: 'shield', n: 4 }] },
      { id: 'vrazhdebnoe', name: 'Враждебное поглощение', cost: 3, target: true, desc: 'четыре урона цели и кража одного её артефакта', ops: [{ t: 'dmg', who: 'target', n: 4 }, { t: 'stealArtifact', who: 'target', n: 1 }] },
      { id: 'insayd', name: 'Инсайдерская сделка', cost: 1, desc: 'сбрасывает свой артефакт и берёт две карты способностей из колоды', ops: [{ t: 'discardArtifact', who: 'self' }, { t: 'drawAbility', n: 2 }] },
      { id: 'shantazh', name: 'Корпоративный шантаж', cost: 4, target: true, desc: 'цель либо отдаёт три менталки, артефакт и получает два урона, либо получает шесть урона', modes: [
        { label: 'цель отдаёт ресурсы', cost: 4, target: true, ops: [{ t: 'mental', who: 'target', n: -3 }, { t: 'stealArtifact', who: 'target', n: 1 }, { t: 'dmg', who: 'target', n: 2 }] },
        { label: 'цель получает шесть урона', cost: 4, target: true, ops: [{ t: 'dmg', who: 'target', n: 6 }] }
      ] }
    ]
  },
  {
    id: 'hrom', name: 'Хром', full: 'Киборг-наёмник Хром', gen: 'Хрома', acc: 'Хрома', dat: 'Хрому',
    world: 'cyber', hp: 26, dmg: 2, mental: 4, mana: 4, handLimit: 3, artifactLimit: 999, passive: 'Пока у него есть хотя бы одна единица щита, способности и артефакты стоят на одну единицу меньше.', shieldCap: 5,
    text: 'Он заменил плоть на металл, сердце на насос, а боль — на протокол. Когда корпорации перестали платить, Хром стал наёмником без хозяина, живой машиной войны.',
    abilities: [
      { id: 'overdrive', name: 'Овердрайв', cost: 1, desc: 'на следующем ходу добавляет две единицы к урону атаки или боевой способности', ops: [{ t: 'buff', n: 2 }] },
      { id: 'samovosstanovlenie', name: 'Система самовосстановления', cost: 1, desc: 'восстанавливает четыре здоровья', ops: [{ t: 'heal', who: 'self', n: 4 }] },
      { id: 'titan', name: 'Титановое покрытие', cost: 2, desc: 'пять единиц щита, держится до разрушения', ops: [{ t: 'shield', n: 5, forever: true }] },
      { id: 'zalp', name: 'Залп микрометчиков', cost: 2, desc: 'по два урона всем остальным', ops: [{ t: 'dmg', who: 'others', n: 2 }] },
      { id: 'shoker', name: 'Встроенный шокер', cost: 2, target: true, desc: 'два урона цели и минус одна энергия у неё', ops: [{ t: 'dmg', who: 'target', n: 2 }, { t: 'energy', who: 'target', n: -1 }] },
      { id: 'stena', name: 'Защитный протокол «Стена»', cost: 2, desc: 'поглощает три урона только от способностей и артефактов', ops: [{ t: 'dmgReduce', n: 3 }] },
      { id: 'hladagent', name: 'Выброс хладагента', cost: 1, desc: 'снимает пропуск хода, бьёт по два урона обоим соседям', ops: [{ t: 'purge' }, { t: 'dmg', who: 'neighbors', n: 1 }] },
      { id: 'sudnyi', name: 'Выстрел из пушки судного дня', cost: 3, target: true, desc: 'пять урона цели, игнорируя щиты', ops: [{ t: 'dmg', who: 'target', n: 5, pierce: true }] }
    ]
  },
  {
    id: 'glyuk', name: 'Глюк', full: 'Нетраннер Глюк', gen: 'Глюка', acc: 'Глюка', dat: 'Глюку',
    world: 'cyber', hp: 26, dmg: 2, mental: 5, mana: 6, handLimit: 4, artifactLimit: 999, passive: 'Если рука способностей пуста, возвращает две карты без действия.', shieldCap: 5,
    text: 'Глюк — затворник глубокой сети, давно потерявший связь с физической реальностью и видящий мир через бегущие строки программного кода. Он презирает грубую силу, побеждая оппонентов сбоями систем, перехватом управления и утечками данных.',
    abilities: [
      { id: 'vzlom', name: 'Взлом протокола', cost: 2, target: true, desc: 'цель сбрасывает одну способность, у неё минус одна энергия', ops: [{ t: 'discardAbility', who: 'target', n: 1 }, { t: 'energy', who: 'target', n: -1 }] },
      { id: 'faervol', name: 'Фаервол', cost: 2, desc: 'пять щита; когда щит разрушают, все игроки теряют по одной энергии', ops: [{ t: 'shield', n: 5, punishAll: 1 }] },
      { id: 'peregruzka', name: 'Перегрузка нейросети', cost: 3, target: true, desc: 'пять урона цели и минус две менталки', ops: [{ t: 'dmg', who: 'target', n: 5 }, { t: 'mental', who: 'target', n: -2 }] },
      { id: 'virus', name: 'Вирусная инъекция', cost: 2, target: true, desc: 'цель не может применять артефакты и способности до вашего следующего хода', ops: [{ t: 'noArtifacts', who: 'target' }, { t: 'noAbilities', who: 'target' }] },
      { id: 'ddos', name: 'DDOS атака', cost: 3, desc: 'все остальные получают по четыре урона и теряют по две энергии', ops: [{ t: 'dmg', who: 'others', n: 4 }, { t: 'energy', who: 'others', n: -2 }] },
      { id: 'podmena', name: 'Подмена трафика', cost: 1, target: true, desc: 'цель сбрасывает выбранный артефакт', ops: [{ t: 'discardArtifact', who: 'target' }, { t: 'look', who: 'target' }] },
      { id: 'perezagruzka', name: 'Аварийная перезагрузка', cost: 1, desc: 'снимает контроль и запреты, даёт три энергии', ops: [{ t: 'purge' }, { t: 'energy', who: 'self', n: 3 }] },
      { id: 'sboi', name: 'Системный сбой', cost: 4, desc: 'по три урона всем остальным и дополнительное действие', ops: [{ t: 'dmg', who: 'others', n: 3 }, { t: 'extraAction', n: 1 }] }
    ]
  },

  /* ---------------- Земля 404 ---------------- */
  {
    id: 'borya', name: 'Боря', full: 'Алкаш-Волшебник «Боря Заливной»', gen: 'Бори', acc: 'Борю', dat: 'Боре',
    world: 'earth404', hp: 26, dmg: 1, mental: 5, mana: 5, handLimit: 4, artifactLimit: 999, passive: 'Бьёт с руки на одну единицу слабее. Когда не хватает двух энергии, прибавляет единицу к урону обычной атаки. Когда не хватает четырёх — прибавляет ещё одну, но и сам получает на единицу больше урона от любых источников.', shieldCap: 5,
    text: 'Боря Заливной — маг-самоучка из грязных переулков, открывший тайны высшей магии на дне дешевых бутылок. Законы физики и здравого смысла бессильны перед его заплетающимися ногами и взрывоопасным дыханием.',
    abilities: [
      { id: 'peregar', name: 'Огненный перегар', cost: 2, target: true, desc: 'три урона цели и ещё два в начале её следующего хода', ops: [{ t: 'dmg', who: 'target', n: 3 }, { t: 'dot', who: 'target', n: 2 }] },
      { id: 'barrier', name: 'Хмельной барьер', cost: 2, desc: 'пять щита; пока он держится, при получении урона любая цель получает один урон', ops: [{ t: 'shield', n: 5, retal: 1 }] },
      { id: 'zakuska', name: 'Закуска', cost: 1, needArtifacts: 2, desc: 'сбрасывает два артефакта, лечит четыре здоровья и одну менталку', ops: [{ t: 'discardArtifact', who: 'self', n: 2 }, { t: 'heal', who: 'self', n: 4 }, { t: 'mental', who: 'self', n: 1 }] },
      { id: 'pyanaya', name: 'Пьяная траектория', cost: 2, reaction: true, desc: 'реакция: входящий направленный урон перенаправляется в соседа атакующего', ops: [{ t: 'redirect' }] },
      { id: 'tost', name: 'Тост за здравие', cost: 2, target: true, desc: 'четыре здоровья себе и два выбранному игроку', ops: [{ t: 'heal', who: 'self', n: 4 }, { t: 'heal', who: 'target', n: 2 }] },
      { id: 'draka', name: 'Драка со столбом', cost: 2, desc: 'по четыре урона обоим соседям и два себе', ops: [{ t: 'dmg', who: 'neighbors', n: 4 }, { t: 'dmg', who: 'self', n: 2, pierce: true }] },
      { id: 'sindrom', name: 'Похмельный синдром', cost: 3, target: true, desc: 'четыре урона цели и минус две менталки', ops: [{ t: 'dmg', who: 'target', n: 4 }, { t: 'mental', who: 'target', n: -2 }] },
      { id: 'vihr', name: 'Запойный вихрь', cost: 4, desc: 'по четыре урона всем остальным и три энергии себе', ops: [{ t: 'dmg', who: 'others', n: 4 }, { t: 'energy', who: 'self', n: 3 }] }
    ]
  },
  {
    id: 'lyusya', name: 'Люся', full: 'Инфлюенсер Апокалипсиса Люся Бум', gen: 'Люси', acc: 'Люсю', dat: 'Люсе',
    world: 'earth404', hp: 26, dmg: 2, mental: 5, mana: 5, handLimit: 4, artifactLimit: 999, passive: 'Нанеся за одно действие урон по двум и более целям, берёт один артефакт.', shieldCap: 6,
    text: 'Люся Бум — звезда стримов судного дня, бегающая по руинам цивилизации с селфи-палкой и связкой взрывчатки. Ее не пугают монстры и лазерные залпы, ведь главное — удержать онлайн и выпросить донаты у зрителей.',
    abilities: [
      { id: 'strim', name: 'Стрим на миллион', cost: 2, desc: 'все остальные теряют по две энергии и по две менталки', ops: [{ t: 'energy', who: 'others', n: -1 }, { t: 'mental', who: 'others', n: -1 }] },
      { id: 'hayp', name: 'Хайповый взрыв', cost: 3, target: true, desc: 'три урона цели и запрет обычной атаки на её ходу', ops: [{ t: 'dmg', who: 'target', n: 3 }, { t: 'noAttack', who: 'target' }] },
      { id: 'donat', name: 'Донатный щит', cost: 2, desc: 'шесть щита при двух артефактах в руке, иначе три', ops: [{ t: 'shield', n: 6, lessIfFewArtifacts: 3, richAt: 2 }] },
      { id: 'klikbeyt', name: 'Кликбейт', cost: 1, target: true, desc: 'ваш сосед обязан на своём ходу ударить второго вашего соседа, но не вас', ops: [{ t: 'attackNeighbor' }] },
      { id: 'toksich', name: 'Токсичный коммент', cost: 2, target: true, desc: 'два урона, минус две менталки и одна энергия у цели', ops: [{ t: 'dmg', who: 'target', n: 1 }, { t: 'mental', who: 'target', n: -1 }, { t: 'energy', who: 'target', n: -1 }] },
      { id: 'raspakovka', name: 'Распаковка на стриме', cost: 1, desc: 'сбрасывает артефакт и берёт два новых из колоды', ops: [{ t: 'discardArtifact', who: 'self' }, { t: 'drawArtifact', n: 2 }] },
      { id: 'ohota', name: 'Охота за лайками', cost: 2, desc: 'по два урона всем остальным, лечение на весь нанесённый урон', ops: [{ t: 'dmg', who: 'others', n: 1, leechPerTarget: 1 }] },
      { id: 'otmena', name: 'Отмена в прямом эфире', cost: 4, target: true, desc: 'пять урона, цель теряет всю менталку и сбрасывает все артефакты', ops: [{ t: 'dmg', who: 'target', n: 4 }, { t: 'mental', who: 'target', n: -99 }, { t: 'discardHalfArtifacts', who: 'target' }] }
    ]
  },
  {
    id: 'grigori', name: 'Григорий', full: 'Президент Сверхгуманности Григорий Великий', gen: 'Григория', acc: 'Григория', dat: 'Григорию',
    world: 'earth404', hp: 27, dmg: 1, mental: 6, mana: 5, handLimit: 4, artifactLimit: 999, passive: 'С одним артефактом в руке прибавляет единицу к урону атаки, с двумя усиливает лечение на единицу, с тремя получает на единицу меньше урона.', shieldCap: 5,
    text: 'Григорий Великий — бессменный лидер вымышленного департамента всеобщего блага, решающий любые конфликты наложением пошлин, пакетами санкций и принудительным миром.',
    abilities: [
      { id: 'pomoshch', name: 'Гуманитарная помощь', cost: 1, target: true, desc: 'четыре здоровья себе и по одному всем остальным', ops: [{ t: 'heal', who: 'self', n: 4 }, { t: 'heal', who: 'others', n: 1 }] },
      { id: 'nalog', name: 'Налог на агрессию', cost: 2, desc: 'все до следующего хода бьют слабее на единицу и платят на единицу больше', ops: [{ t: 'taxAll' }] },
      { id: 'mirny', name: 'Мирный договор', cost: 1, target: true, desc: 'цель не может атаковать вас на своём ходу, а вы не можете бить её на следующем своём', ops: [{ t: 'noAttack', who: 'target' }, { t: 'mirrorRestrict', who: 'target' }] },
      { id: 'sankcii', name: 'Пакет санкций', cost: 2, target: true, desc: 'один урон, цель теряет две менталки, две энергии и не может применять артефакты', ops: [{ t: 'dmg', who: 'target', n: 1 }, { t: 'mental', who: 'target', n: -2 }, { t: 'energy', who: 'target', n: -2 }, { t: 'noArtifacts', who: 'target' }] },
      { id: 'byurokrat', name: 'Бюрократический ад', cost: 2, target: true, desc: 'цель сбрасывает способность и артефакт, а если у неё их нет — получает пять урона', ops: [{ t: 'discardOrDamage', who: 'target', n: 5 }] },
      { id: 'prinuzhdenie', name: 'Принуждение к миру', cost: 4, target: true, desc: 'пропуск хода; если у цели больше здоровья, она получает разницу до восьми', ops: [{ t: 'skip', who: 'target' }, { t: 'dmgDiff', who: 'target', max: 8 }] },
      { id: 'raspil', name: 'Распил бюджета', cost: 1, desc: 'сбрасывает артефакт, даёт четыре энергии, две менталки и два здоровья', ops: [{ t: 'discardArtifact', who: 'self' }, { t: 'energy', who: 'self', n: 4 }, { t: 'mental', who: 'self', n: 2 }, { t: 'heal', who: 'self', n: 2 }] },
      { id: 'ukaz', name: 'Запретительный указ', cost: 3, desc: 'до вашего следующего хода нельзя играть способности от двух энергии и артефакты от трёх менталки', ops: [{ t: 'forbidBig', abilityMin: 2, artifactMin: 3 }] }
    ]
  },

  /* ---------------- Фэнтези ---------------- */
  {
    id: 'mag', name: 'Безумный Маг', full: 'Безумный Маг', gen: 'Безумного Мага', acc: 'Безумного Мага', dat: 'Безумному Магу',
    world: 'fantasy', hp: 26, dmg: 1, mental: 5, mana: 8, handLimit: 5, artifactLimit: 999, passive: 'Обмен артефакта даёт и энергию, и способность, причём карту маг выбирает сам.', shieldCap: 5,
    text: 'Безумный Маг — нестабильный гений, который черпает силу из хаоса. Его заклинания разрушительны, мощны и абсолютно непредсказуемы, неся угрозу как его врагам, так и его собственному телу и разуму.',
    abilities: [
      { id: 'vspyshka', name: 'Вспышка Бездны', cost: 2, target: true, desc: 'шесть урона цели и два себе', ops: [{ t: 'dmg', who: 'target', n: 6 }, { t: 'dmg', who: 'self', n: 2, pierce: true }] },
      { id: 'haos', name: 'Хаотическое заклинание', cost: 2, desc: 'на выбор: три урона всем, пять здоровья себе или три энергии себе', modes: [
        { label: 'три урона всем остальным', cost: 2, ops: [{ t: 'dmg', who: 'others', n: 3 }] },
        { label: 'пять здоровья себе', cost: 2, ops: [{ t: 'heal', who: 'self', n: 5 }] },
        { label: 'три энергии себе', cost: 0, ops: [{ t: 'energy', who: 'self', n: 3 }] }
      ] },
      { id: 'illyuzii', name: 'Призыв Иллюзий', cost: 1, desc: 'четыре единицы щита', ops: [{ t: 'shield', n: 4 }] },
      { id: 'razryv', name: 'Разрыв реальности', cost: 4, desc: 'четыре урона всем остальным и дополнительное действие', ops: [{ t: 'dmg', who: 'others', n: 4 }, { t: 'extraAction' }] },
      { id: 'mutaciya', name: 'Мутация', cost: 2, target: true, desc: 'либо цель бьёт на три меньше, либо вы получаете семь и прибавку к максимуму здоровья', modes: [{ label: 'ослабить цель', cost: 2, target: true, ops: [{ t: 'weaken', who: 'target', n: 2, turns: 2 }] }, { label: 'усилить себя', cost: 2, ops: [{ t: 'magBuff', n: 1, turns: 2 }] }] },
      { id: 'proryv', name: 'Научный прорыв', cost: 0, desc: 'три щита, две энергии, две менталки и дополнительное действие', ops: [{ t: 'shield', n: 3 }, { t: 'energy', who: 'self', n: 2 }, { t: 'mental', who: 'self', n: 2 }, { t: 'extraAction', n: 1 }] },
      { id: 'porcha', name: 'Порча', cost: 3, target: true, desc: 'четыре урона цели и сброс двух её способностей', ops: [{ t: 'dmg', who: 'target', n: 4 }, { t: 'discardAbility', who: 'target', n: 2 }] },
      { id: 'singulyarnost', name: 'Перегрузка сингулярности', cost: 4, target: true, desc: 'восемь урона цели, по два всем остальным, два себе', ops: [{ t: 'dmg', who: 'target', n: 8 }, { t: 'dmg', who: 'others', n: 2 }, { t: 'dmg', who: 'self', n: 2, pierce: true }] }
    ]
  },
  {
    id: 'grog', name: 'Грог', full: 'Тролль-берсеркер Грог', gen: 'Грога', acc: 'Грога', dat: 'Грогу',
    world: 'fantasy', hp: 24, dmg: 2, mental: 3, mana: 3, handLimit: 3, artifactLimit: 999, passive: 'При одиннадцати здоровья и меньше получает на одну единицу больше лечения, при семи и меньше наносит на одну единицу больше урона.', shieldCap: 5,
    text: 'Тролль-берсеркер Грог — несокрушимая гора ярости, не признающая сложной магии. Его тяжелая узловатая дубина сокрушает любые доспехи, а толстая шкура затягивает глубокие раны прямо во время боя.',
    abilities: [
      { id: 'regeneraciya', name: 'Троллья регенерация', cost: 2, desc: 'восстанавливает четыре здоровья, а при четырнадцати и меньше — восемь', ops: [{ t: 'heal', who: 'self', n: 4, lowHp: 14, lowN: 8 }] },
      { id: 'krovavaya', name: 'Кровавая ярость', cost: 1, desc: 'теряете два здоровья; на следующем ходу любой ваш урон больше на три', ops: [{ t: 'dmg', who: 'self', n: 2, pierce: true }, { t: 'buff', n: 3, anyTarget: true }] },
      { id: 'okamenenie', name: 'Окаменение кожи', cost: 1, desc: 'пять щита; пока держится, весь урон снижается на один', ops: [{ t: 'shield', n: 5, reduce: 1 }] },
      { id: 'razmashistyi', name: 'Размашистый удар дубиной', cost: 2, desc: 'по четыре урона всем остальным игрокам', ops: [{ t: 'dmg', who: 'others', n: 4 }] },
      { id: 'rev', name: 'Обидчивый рёв', cost: 2, target: true, desc: 'цель на своём ходу обязана ударить Грога на единицу меньше и получает четыре урона', ops: [{ t: 'taunt', who: 'target', n: 4 }] },
      { id: 'prevozmoganie', name: 'Превозмогание боли', cost: 1, desc: 'снимает контроль и запреты, весь урон до следующего хода снижен на три', ops: [{ t: 'purge' }, { t: 'dmgReduce', n: 3 }] },
      { id: 'kus', name: 'Голодный кусь', cost: 2, target: true, desc: 'три урона, три здоровья себе и кража артефакта', ops: [{ t: 'dmg', who: 'target', n: 3 }, { t: 'heal', who: 'self', n: 3 }, { t: 'stealArtifact', who: 'target', n: 1 }] },
      { id: 'razh', name: 'Смертельный раж', cost: 3, target: true, desc: 'три урона плюс один за каждые четыре недостающие единицы здоровья', ops: [{ t: 'dmgMissing', who: 'target', base: 3, per: 4 }] }
    ]
  },
  {
    id: 'zhulien', name: 'Жюльен', full: 'Вор-Аристократ «Жюльен»', gen: 'Жюльена', acc: 'Жюльена', dat: 'Жюльену',
    world: 'fantasy', hp: 25, dmg: 3, mental: 5, mana: 5, handLimit: 4, artifactLimit: 999, passive: 'Обычной атакой может украсть один артефакт вместо удара.', shieldCap: 5,
    text: 'Жюльен — циничный дворянин без гроша в кармане, променявший фамильный замок на карманные кражи и дуэли на задворках летающих островов. В бою он делает ставку на скорость, яды, обман и воровство чужих запасов.',
    abilities: [
      { id: 'lovkost', name: 'Ловкость рук', cost: 1, target: true, desc: 'забирает случайный артефакт у цели', ops: [{ t: 'stealArtifact', who: 'target', n: 1 }] },
      { id: 'ispodtishka', name: 'Удар исподтишка', cost: 3, target: true, desc: 'если у цели есть щит — два урона сквозь щит и три по щиту, иначе пять урона', ops: [{ t: 'shieldBreaker', who: 'target', through: 4, toShield: 2, plain: 6 }] },
      { id: 'parirovanie', name: 'Парирование рапирой', cost: 1, reaction: true, desc: 'реакция: полностью отменяет входящий удар и возвращает весь урон нападающему', ops: [] },
      { id: 'dymovaya', name: 'Дымовая шашка', cost: 2, desc: 'до вашего следующего хода вас нельзя бить атакой и способностями, снимает контроль и даёт дополнительное действие', ops: [{ t: 'purge' }, { t: 'extraAction', n: 1 }] },
      { id: 'igla', name: 'Отравленная игла', cost: 2, target: true, desc: 'два урона сразу и три в конце следующего хода цели, если она не вылечится', ops: [{ t: 'dmg', who: 'target', n: 2 }, { t: 'dot', who: 'target', n: 3 }] },
      { id: 'podmena', name: 'Подмена карманов', cost: 1, target: true, desc: 'отдаёт свой артефакт и забирает два чужих', ops: [{ t: 'giveArtifact', who: 'target' }, { t: 'stealArtifact', who: 'target', n: 2 }] },
      { id: 'luk', name: 'Выстрел из лука', cost: 4, target: true, desc: 'восемь урона любой цели без правила соседей', ops: [{ t: 'dmg', who: 'target', n: 8 }] },
      { id: 'grabezh', name: 'Благородный грабеж', cost: 3, target: true, desc: 'три урона и кража трёх здоровья, трёх менталки и трёх энергии', ops: [{ t: 'dmg', who: 'target', n: 3 }, { t: 'drainHp', who: 'target', n: 3 }, { t: 'mental', who: 'target', n: -3 }, { t: 'energy', who: 'target', n: -3 }, { t: 'mental', who: 'self', n: 3 }, { t: 'energy', who: 'self', n: 3 }] }
    ]
  },

  /* ---------------- Космос ---------------- */
  {
    id: 'omnis', name: 'Омнис', full: 'Интеллект-сфера Омнис', gen: 'Омниса', acc: 'Омниса', dat: 'Омнису',
    world: 'space', hp: 27, dmg: 1, mental: 8, mana: 6, handLimit: 5, artifactLimit: 999, passive: 'Артефакты чужих миров стоят на две менталки меньше.', shieldCap: 6,
    text: 'Омнис — автономный боевой суперкомпьютер Звездного Консорциума, помещенный в парящую титановую сферу. Он не ведает эмоций, страха или усталости, а бой воспринимает как математическую задачу с неизбежным решением.',
    abilities: [
      { id: 'scan', name: 'Аналитический скан', cost: 1, target: true, desc: 'цель теряет две менталки; вы видите и артефакты, и способности цели', ops: [{ t: 'mental', who: 'target', n: -2 }, { t: 'look', who: 'target' }] },
      { id: 'pole', name: 'Силовое поле', cost: 2, desc: 'шесть единиц щита', ops: [{ t: 'shield', n: 6 }] },
      { id: 'deinteg', name: 'Дезинтеграция', cost: 4, target: true, desc: 'шесть урона сквозь щит', ops: [{ t: 'dmg', who: 'target', n: 6, pierce: true }] },
      { id: 'peregruzka', name: 'Перегрузка систем', cost: 2, target: true, desc: 'цель пропускает свой следующий ход', ops: [{ t: 'skip', who: 'target' }] },
      { id: 'pereliv', name: 'Энергетический перелив', cost: 0, desc: 'две менталки в три энергии или две энергии в три менталки, плюс дополнительное действие', modes: [{ label: 'менталка в энергию', cost: 0, ops: [{ t: 'mental', who: 'self', n: -2 }, { t: 'energy', who: 'self', n: 3 }, { t: 'extraAction', n: 1 }] }, { label: 'энергия в менталку', cost: 0, ops: [{ t: 'energy', who: 'self', n: -2 }, { t: 'mental', who: 'self', n: 3 }, { t: 'extraAction', n: 1 }] }] },
      { id: 'fazovyi', name: 'Фазовый сдвиг', cost: 2, reaction: true, desc: 'реакция: полностью игнорирует входящий урон без затрат менталки', ops: [{ t: 'negate' }] },
      { id: 'turel', name: 'Плазменная турель', cost: 3, desc: 'по три урона обоим соседям', ops: [{ t: 'dmg', who: 'neighbors', n: 3 }] },
      { id: 'veroyatnosti', name: 'Вычисление вероятностей', cost: 1, desc: 'смотрит три верхних артефакта колоды, берёт два и один возвращает наверх', ops: [{ t: 'drawArtifact', n: 2 }, { t: 'lookDeck' }] }
    ]
  },
  {
    id: 'heil', name: 'Хейл', full: 'Командор дредноута «Варс Хейл»', gen: 'Хейла', acc: 'Хейла', dat: 'Хейлу',
    world: 'space', hp: 27, dmg: 1, mental: 4, mana: 4, handLimit: 3, artifactLimit: 999, passive: 'Складывает до двух карт щита, в сумме до десяти единиц.', shieldCap: 10,
    text: 'Когда звёздные колонии рухнули, Варс Хейл остался один на борту полуработающего дредноута «Клятва». Его корабль теперь — продолжение его воли, его броня — обломки погибших флотов.',
    abilities: [
      { id: 'orbital', name: 'Орбитальный залп', cost: 4, desc: 'по шесть урона всем остальным', ops: [{ t: 'dmg', who: 'others', n: 6 }] },
      { id: 'perenapravlenie', name: 'Перенаправление щитов', cost: 2, desc: 'семь единиц щита до разрушения', ops: [{ t: 'shield', n: 7 }] },
      { id: 'protivooskol', name: 'Противоосколочный протокол', cost: 2, desc: 'снижает любой получаемый урон на четыре на два хода, но не ниже одной единицы', ops: [{ t: 'dmgReduce', n: 4, turns: 2 }] },
      { id: 'perehvatchik', name: 'Бортовой перехватчик', cost: 1, target: true, desc: 'цель не может атаковать вас обычной атакой', ops: [{ t: 'noAttack', who: 'target' }] },
      { id: 'taran', name: 'Энергетический таран', cost: 2, target: true, desc: 'четыре урона и минус два щита у цели', ops: [{ t: 'dmg', who: 'target', n: 4 }, { t: 'shieldDown', who: 'target', n: 2 }] },
      { id: 'peregruppirovka', name: 'Тактическая перегруппировка', cost: 1, desc: 'снимает все негативные эффекты, включая пропуск хода, и лечит четыре здоровья', ops: [{ t: 'purge' }, { t: 'heal', who: 'self', n: 4 }] },
      { id: 'veer', name: 'Веерный залп турелей', cost: 3, desc: 'по три урона обоим соседям', ops: [{ t: 'dmg', who: 'neighbors', n: 3 }] },
      { id: 'reaktor', name: 'Резервный реактор дредноута', cost: 0, desc: 'даёт три менталки и три энергии', ops: [{ t: 'mental', who: 'self', n: 3 }, { t: 'energy', who: 'self', n: 3 }] }
    ]
  },
  {
    id: 'etkora', name: 'Эт’Кора', full: 'Ксеноморф-псион Эт’Кора', gen: 'Эт’Коры', acc: 'Эт’Кору', dat: 'Эт’Коре',
    world: 'space', hp: 26, dmg: 1, mental: 6, mana: 10, handLimit: 6, artifactLimit: 999, passive: 'Ворованные способности стоят на одну энергию меньше.', shieldCap: 5,
    text: 'Рожденная в туманностях Арк Риона, она не имеет тела в привычном смысле — ее оболочка постоянно меняет форму, подстраиваясь под окружающую энергию. Эт Кора общается мыслями, проникая в чужой разум.',
    abilities: [
      { id: 'psi', name: 'Психический всплеск', cost: 2, target: true, desc: 'три урона менталке цели, два здоровью и кража одной способности', ops: [{ t: 'mental', who: 'target', n: -3 }, { t: 'dmg', who: 'target', n: 2 }, { t: 'stealAbility', who: 'target', n: 1 }] },
      { id: 'boli', name: 'Иллюзия боли', cost: 3, target: true, desc: 'пропуск хода и три урона', ops: [{ t: 'skip', who: 'target' }, { t: 'dmg', who: 'target', n: 3 }] },
      { id: 'klinok', name: 'Ментальный клинок', cost: 2, target: true, desc: 'пять урона сквозь щит', ops: [{ t: 'dmg', who: 'target', n: 5, pierce: true }] },
      { id: 'volna', name: 'Волна ужаса', cost: 4, desc: 'по три урона всем, минус энергия и кража способности у каждого', ops: [{ t: 'dmg', who: 'others', n: 3 }, { t: 'energy', who: 'others', n: -1 }, { t: 'stealAbility', who: 'others', n: 1 }] },
      { id: 'kontrol', name: 'Контроль разума', cost: 3, target: true, desc: 'либо цель бьёт любого на две больше, либо три урона и кража карты и артефакта', modes: [
        { label: 'цель бьёт любого', cost: 3, target: true, ops: [{ t: 'puppet', who: 'target', bonus: 2 }] },
        { label: 'урон и кража', cost: 3, target: true, ops: [{ t: 'dmg', who: 'target', n: 3 }, { t: 'stealAbility', who: 'target', n: 1 }, { t: 'stealArtifact', who: 'target', n: 1 }] }
      ] },
      { id: 'bronya', name: 'Психическая броня', cost: 1, desc: 'четыре единицы щита', ops: [{ t: 'shield', n: 4 }] },
      { id: 'pozhiranie', name: 'Пожирание мысли', cost: 3, target: true, desc: 'четыре урона, три здоровья себе и кража двух способностей', ops: [{ t: 'dmg', who: 'target', n: 4 }, { t: 'heal', who: 'self', n: 3 }, { t: 'stealAbility', who: 'target', n: 2 }] },
      { id: 'psihkoz', name: 'Массовый психоз', cost: 4, desc: 'подчиняет всех: каждый игрок делает одно действие на выбор Эт’Коры, не тратя ресурсов', ops: [{ t: 'massControl' }] }
    ]
  }
];

/* ---------------- Артефакты: 24 карты, по шесть на мир ---------------- */

function art(id, name, world, cost, desc, ops, opts) {
  return Object.assign({ id: id, name: name, world: world, cost: cost, trade: cost, desc: desc, ops: ops }, opts || {});
}

var ARTIFACTS = [
  /* Фэнтези */
  art('klinok', 'Клинок Рассвета', 'fantasy', 2, 'четыре урона цели', [{ t: 'dmg', who: 'target', n: 4 }], { target: true }),
  art('shchit_drevnih', 'Щит Древних', 'fantasy', 2, 'пять единиц щита до разрушения', [{ t: 'shield', n: 5, forever: true }]),
  art('eliksir', 'Эликсир Бездны', 'fantasy', 3, 'восстанавливает пять здоровья', [{ t: 'heal', who: 'self', n: 5 }]),
  art('berserk', 'Зелье берсерка', 'fantasy', 2, 'на следующем ходу плюс три к урону', [{ t: 'buff', n: 3 }]),
  art('svitok', 'Свиток очищения', 'fantasy', 1, 'снимает негативные эффекты, пропуски и запреты', [{ t: 'purge' }]),
  art('altar', 'Жертвенный алтарь', 'fantasy', 4, 'теряете пять здоровья, получаете пять энергии и три действия', [{ t: 'dmg', who: 'self', n: 5, pierce: true }, { t: 'energy', who: 'self', n: 5 }, { t: 'extraAction', n: 2 }]),

  /* Киберпанк */
  art('roy', 'Рой дронов', 'cyber', 3, 'два урона всем остальным', [{ t: 'dmg', who: 'others', n: 2 }]),
  art('energocell', 'Энергоячейка', 'cyber', 2, 'четыре энергии себе, не тратит ход', [{ t: 'energy', who: 'self', n: 4 }], { freeAction: true }),
  art('zamorozka', 'Протокол «Заморозка»', 'cyber', 2, 'цель пропускает ход', [{ t: 'skip', who: 'target' }], { target: true }),
  art('glushilka', 'Глушилка связи', 'cyber', 3, 'цель не может применять способности', [{ t: 'noAbilities', who: 'target' }], { target: true }),
  art('neyrostim', 'Нейростимулятор', 'cyber', 2, 'два действия подряд', [{ t: 'extraAction', n: 1 }], { mentalCost: 2 }),
  art('bekdor', 'Бэкдор', 'cyber', 3, 'возвращает две способности из сброса в руку', [{ t: 'returnAbility', n: 2 }]),

  /* Космос */
  art('railgun', 'Рельсотрон', 'space', 3, 'четыре урона сквозь щит', [{ t: 'dmg', who: 'target', n: 4, pierce: true }], { target: true }),
  art('life', 'Система жизнеобеспечения', 'space', 2, 'три здоровья и две энергии', [{ t: 'heal', who: 'self', n: 3 }, { t: 'energy', who: 'self', n: 2 }]),
  art('emp', 'Импульс ЭМИ', 'space', 3, 'все теряют по две энергии', [{ t: 'energy', who: 'others', n: -2 }]),
  art('gravitaciya', 'Гравитационная ловушка', 'space', 4, 'соседи получают по два урона и не могут бить вас', [{ t: 'dmg', who: 'neighbors', n: 2 }, { t: 'noAttackNeighbors' }]),
  art('foton', 'Фотонный барьер', 'space', 1, 'блокирует следующий удар целиком', [{ t: 'blockNext' }]),
  art('skaner', 'Орбитальный сканер', 'space', 2, 'смотрит три карты колоды и берёт одну', [{ t: 'drawArtifact', n: 1 }, { t: 'lookDeck' }]),

  /* Земля 404 */
  art('uvolnenie', 'Увольнение', 'earth404', 3, 'три урона и минус три энергии', [{ t: 'dmg', who: 'target', n: 3 }, { t: 'energy', who: 'target', n: -3 }], { target: true }),
  art('autsors', 'Аутсорсинг здоровья', 'earth404', 3, 'восстанавливает пять здоровья', [{ t: 'heal', who: 'self', n: 5 }]),
  art('sozvon', 'Бесконечный созвон', 'earth404', 3, 'пропуск хода и минус две энергии', [{ t: 'skip', who: 'target' }, { t: 'energy', who: 'target', n: -2 }], { target: true }),
  art('dedlayn', 'Горящий дедлайн', 'earth404', 2, 'три урона, если у цели два и больше артефактов', [{ t: 'dmgIfArtifacts', who: 'target', n: 3, need: 2 }], { target: true }),
  art('espresso', 'Двойной эспрессо', 'earth404', 1, 'две энергии и снимает пропуск, не тратит ход', [{ t: 'energy', who: 'self', n: 2 }, { t: 'purge' }], { freeAction: true }),
  art('otzyv', 'Токсичный отзыв', 'earth404', 3, 'минус две менталки и одна энергия у цели', [{ t: 'mental', who: 'target', n: -2 }, { t: 'energy', who: 'target', n: -1 }], { target: true })
];

module.exports = {
  WORLDS: WORLDS,
  CHARACTERS: CHARACTERS,
  ARTIFACTS: ARTIFACTS
};
