import fs from 'node:fs';

const p = 'game-lab/tools/desc-from-ops.mjs';
let s = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

function rep(old, neu, label) {
  if (!s.includes(old)) throw new Error('не найдено: ' + label);
  s = s.replace(old, neu);
  console.log('ok: ' + label);
}

/* помощник для единиц */
rep(`const ART = (n) => plural(n, 'артефакт', 'артефакта', 'артефактов');`,
    `const ONE = (n) => plural(n, 'единица', 'единицы', 'единиц');
const ART = (n) => plural(n, 'артефакт', 'артефакта', 'артефактов');`,
    'склонение единиц');

/* здоровье */
rep(`      if (w === 'self') {
        if (op.lowHp !== undefined) return \`восстанавливает \${NUM(n)} здоровья, а при \${NUM(op.lowHp)} и меньше — \${NUM(op.lowN)}\`;
        return \`восстанавливает \${NUM(n)} здоровья\`;
      }
      return \`восстанавливает \${NUM(n)} здоровья выбранному игроку\`;`,
    `      if (w === 'self') {
        if (op.lowHp !== undefined) return \`восстанавливает \${NUM(n)} \${ONE(n)} здоровья, а при \${NUM(op.lowHp)} и меньше — \${NUM(op.lowN)} \${ONE(op.lowN)}\`;
        return \`восстанавливает \${NUM(n)} \${ONE(n)} здоровья\`;
      }
      return \`восстанавливает \${NUM(n)} \${ONE(n)} здоровья выбранному игроку\`;`,
    'лечение');

/* энергия и менталка */
rep(`    case 'energy':
      return n >= 0 ? \`даёт \${NUM(n)} энергии\` : \`отнимает \${NUM(-n)} энергии\`;`,
    `    case 'energy':
      if (n >= 0) return \`даёт \${NUM(n)} \${ONE(n)} энергии\`;
      return \`отнимает \${NUM(-n)} \${ONE(-n)} энергии\`;`,
    'энергия');

rep(`    case 'mental':
      if (n === -99) return 'обнуляет менталку цели';
      return n >= 0 ? \`даёт \${NUM(n)} менталки\` : \`отнимает \${NUM(-n)} менталки\`;`,
    `    case 'mental':
      if (n === -99) return 'обнуляет менталку цели';
      if (n >= 0) return \`даёт \${NUM(n)} \${ONE(n)} менталки\`;
      return \`отнимает \${NUM(-n)} \${ONE(-n)} менталки\`;`,
    'менталка');

/* условный щит */
rep(`      if (op.lessIfFewArtifacts !== undefined) {
        return \`даёт \${NUM(n)} щита при \${NUM(op.richAt || 1)} артефактах в руке, иначе \${NUM(op.lessIfFewArtifacts)}\`;
      }`,
    `      if (op.lessIfFewArtifacts !== undefined) {
        const need = op.richAt || 1;
        return \`даёт \${NUM(n)} щита, если в руке \${NUM(need)} \${ART(need)} или больше, иначе \${NUM(op.lessIfFewArtifacts)}\`;
      }`,
    'условный щит');

/* прочее, где ломалось согласование */
rep(`    case 'drainHp':
      return \`забирает \${NUM(n)} здоровья у цели и восстанавливает столько же себе\`;`,
    `    case 'drainHp':
      return \`забирает \${NUM(n)} \${ONE(n)} здоровья у цели и восстанавливает столько же себе\`;`,
    'кража здоровья');

rep(`    case 'buff':
      return \`прибавляет \${NUM(n)} к урону на следующем ходу\`;`,
    `    case 'buff':
      return \`прибавляет \${NUM(n)} \${ONE(n)} к урону следующей атаки\`;`,
    'прибавка к урону');

rep(`    case 'weaken':
      return \`цель бьёт слабее на \${NUM(n)}\`;`,
    `    case 'weaken':
      return \`цель бьёт слабее на \${NUM(n)} \${ONE(n)}\`;`,
    'ослабление');

rep(`    case 'dmgReduce':
      return \`снижает получаемый урон на \${NUM(n)} на \${NUM(op.turns || 1)} хода, но не ниже \${NUM(1)} единицы\`;`,
    `    case 'dmgReduce':
      return \`снижает получаемый урон на \${NUM(n)} \${ONE(n)} на \${NUM(op.turns || 1)} хода, но не ниже одной единицы\`;`,
    'снижение урона');

rep(`    case 'taunt':
      return \`цель обязана ударить вас и получает \${NUM(n)} урона\`;`,
    `    case 'taunt':
      return \`цель обязана ударить вас и получает \${NUM(n)} урона\`;`,
    'провокация');

rep(`    case 'gainMaxHp':
      return \`повышает здоровье и максимум на \${NUM(n)}\`;`,
    `    case 'gainMaxHp':
      return \`повышает здоровье и его максимум на \${NUM(n)} \${ONE(n)}\`;`,
    'прирост здоровья');

fs.writeFileSync(p, s, 'utf8');
