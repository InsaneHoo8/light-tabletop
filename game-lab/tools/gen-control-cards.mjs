import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const D = require('../arena/game-data.js');

const cards = {
  grigori: {
    title: 'Президент Сверхгуманности «Григорий Великий»',
    text: 'Когда реальность окончательно утратила смысл, люди всё равно пошли на выборы — и выбрали Григория. Почему? Потому что его лозунг «Главное — чтобы громко пердело!» звучал убедительнее всех. Он объявил себя отцом нации, матерью морали и крёстным законов. В его распоряжении — пресс-конференции без вопросов, указ №∞ и армия советников, которые спорят, существует ли он вообще. Григорий Великий уверен, что мир спасёт дисциплина, особенно если её объявить добровольной.',
    out: 'game-lab/rules/card-grigori.json'
  },
  glyuk: {
    title: 'Нетраннер «Глюк»',
    text: 'Когда-то он был лучшим в своём деле — ловил баги в системах мегакорпов, пока сам не стал багом. После неудачного взлома его сознание слилось с фрагментом искусственного интеллекта. Теперь он видит мир как сеть кодов и ошибок, а бой — как процесс перезаписи реальности.',
    out: 'game-lab/rules/card-glyuk.json'
  }
};

for (const [id, info] of Object.entries(cards)) {
  const c = D.charById(id);
  const blocks = [
    { kind: 'p', text: info.text },
    { kind: 'p', text: 'Здоровье ' + c.hp + ', урон ' + c.dmg + ', менталка ' + c.mental + ', энергия ' + c.mana + '.' },
    { kind: 'h', text: 'Способности' }
  ];
  for (const a of c.abilities) {
    let text = a.desc;
    if (a.secondTarget) text += ' Сначала выбирается, кем управлять, потом — кого он ударит.';
    if (a.modes) text += ' Варианты: ' + a.modes.map((m) => m.label).join('; ') + '.';
    blocks.push({ kind: 'b', bold: a.name + ' — ' + a.cost + ' энергии.', text: ' ' + text });
  }
  fs.writeFileSync(info.out, JSON.stringify({ title: info.title, blocks }, null, 2), 'utf8');
  console.log(info.out + ': ' + blocks.length + ' блоков');
}
