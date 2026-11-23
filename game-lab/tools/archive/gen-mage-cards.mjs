import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const D = require('../arena/game-data.js');

const cards = {
  mag: {
    title: 'Персонаж: Безумный Маг',
    text: 'Безумный Маг — нестабильный гений, который черпает силу из хаоса. Он когда-то был учёным, но его эксперименты привели к безумию. Его заклинания мощны, но непредсказуемы, и могут повлиять как на врагов, так и на него самого.',
    out: 'game-lab/rules/card-mag.json'
  },
  etkora: {
    title: 'Ксеноморф-псион «Эт’Кора»',
    text: 'Рождённая в туманностях Арк’Риона, она не имеет тела в привычном смысле — её оболочка постоянно меняет форму, подстраиваясь под окружающую энергию. Эт’Кора общается мыслями, проникая в чужой разум и оставляя там следы ужаса и восхищения. Её вид редко доживает до зрелости — те, кто выживает, становятся живыми орудиями мысли.',
    out: 'game-lab/rules/card-etkora.json'
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
    if (a.modes) {
      blocks.push({ kind: 'b', bold: a.name + ' — ' + a.cost + ' энергии, на выбор.', text: ' ' + a.modes.map((m) => m.label).join('; ') + '.' });
    } else {
      blocks.push({ kind: 'b', bold: a.name + ' — ' + a.cost + ' энергии.', text: ' ' + a.desc + (a.neighborsOnly ? ' Только сосед.' : '') });
    }
  }
  fs.writeFileSync(info.out, JSON.stringify({ title: info.title, blocks }, null, 2), 'utf8');
  console.log(info.out + ': ' + blocks.length + ' блоков');
}
