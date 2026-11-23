import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const D = require('../arena/game-data.js');

const descr = {
  borya: {
    title: 'Алкаш-Волшебник «Боря Заливной»',
    text: 'Боря начал как простой маг в городке на окраине, но однажды нашёл бутылку с древним зельем. Теперь он пьёт вино и варит заклинания, которые либо творят чудеса, либо превращают его самого в хрень. Он не помнит, зачем сражается, но зато помнит все тосты, которые говорил перед боем.',
    out: 'game-lab/rules/card-borya.json'
  },
  lyusya: {
    title: 'Инфлюенсер Апокалипсиса «Люся Бум»',
    text: 'Когда мир начал рушиться, Люся не растерялась — она достала телефон и начала стрим. Теперь катастрофы приносят ей лайки, разрушения — донаты, а паника — новую аудиторию. Она не боится смерти — боится быть «вне тренда». Её фраза «подпишись, если выжил» стала мемом во всех измерениях.',
    out: 'game-lab/rules/card-lyusya.json'
  },
  omnis: {
    title: 'Интеллект-сфера «Омнис»',
    text: 'Омнис — древняя форма жизни, искусственный разум, переживший своих создателей миллионы лет назад. Он странствует по галактике, подключаясь к кораблям, планетам, живым организмам, собирая знания и превращая их в энергию. Для него битва — просто эксперимент, способ понять границы материи и воли.',
    out: 'game-lab/rules/card-omnis.json'
  }
};

for (const [id, info] of Object.entries(descr)) {
  const c = D.charById(id);
  const blocks = [
    { kind: 'p', text: info.text },
    { kind: 'p', text: 'Здоровье ' + c.hp + ', урон ' + c.dmg + ', менталка ' + c.mental + ', энергия ' + c.mana + '.' },
    { kind: 'h', text: 'Способности' }
  ];
  for (const a of c.abilities) {
    if (a.modes) {
      blocks.push({ kind: 'b', bold: a.name + ' — на выбор.', text: ' ' + a.modes.map((m) => m.label + (m.cost ? ' (' + m.cost + ' энергии)' : ' (бесплатно)')).join('; ') + '.' });
    } else {
      blocks.push({ kind: 'b', bold: a.name + ' — ' + a.cost + ' энергии.', text: ' ' + a.desc + (a.neighborsOnly ? ' Только сосед.' : '') });
    }
  }
  fs.writeFileSync(info.out, JSON.stringify({ title: info.title, blocks }, null, 2), 'utf8');
  console.log(info.out + ': ' + blocks.length + ' блоков');
}
