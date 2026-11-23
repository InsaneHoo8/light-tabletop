import fs from 'node:fs';

const p = 'game-lab/tools/desc-from-ops.mjs';
let s = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

const oldShield = `    case 'shield':
      return \`даёт \${NUM(n)} щита до разрушения\`;`;
const newShield = `    case 'shield':
      if (op.lessIfFewArtifacts !== undefined) {
        return \`даёт \${NUM(n)} щита при \${NUM(op.richAt || 1)} артефактах в руке, иначе \${NUM(op.lessIfFewArtifacts)}\`;
      }
      if (op.lessIfNoArtifact !== undefined) {
        return \`даёт \${NUM(n)} щита, если в руке есть артефакт, иначе \${NUM(op.lessIfNoArtifact)}\`;
      }
      return \`даёт \${NUM(n)} щита до разрушения\`;`;

if (!s.includes(oldShield)) throw new Error('не найден case shield');
s = s.replace(oldShield, newShield);

const oldDis = `    case 'discardAllArtifacts':`;
const newDis = `    case 'discardHalfArtifacts':
      return 'цель сбрасывает половину артефактов с округлением вверх';
    case 'discardAllArtifacts':`;
if (!s.includes(oldDis)) throw new Error('не найден case discardAllArtifacts');
s = s.replace(oldDis, newDis);

fs.writeFileSync(p, s, 'utf8');
console.log('описания обновлены');
