import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const D = require('../arena/game-data.js');

const cards = {
  vor: {
    title: 'Персонаж: Вор-Аристократ',
    text: 'Вор-Аристократ — утончённый и хитрый боец, сочетающий ловкость и изысканность. Родился среди дворян, но предпочёл жить в тени, пользуясь своим умением обманывать и воровать. Его приёмы — смесь обмана, яда и искусства дуэли.',
    out: 'game-lab/rules/card-vor.json'
  },
  mirai: {
    title: 'Корпорат-манипулятор «Мирай»',
    text: 'Родилась в нижних секторах, где люди дышали переработанным воздухом и продавали органы за кредиты. Мирай поднялась наверх без оружия — лишь при помощи слов, контрактов и холодного расчёта. Теперь, когда мегакорпы рушатся, она покупает то, что раньше принадлежало богам рынка. Для неё бой — это переговоры, а победа — правильная инвестиция.',
    out: 'game-lab/rules/card-mirai.json'
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
