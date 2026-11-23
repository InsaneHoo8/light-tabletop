/* Проверяет, что документы не разошлись с данными игры:
   все способности и артефакты из cards.js упомянуты в исходниках документов. */

import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const D = require('../arena/game-data.js');

const DOC = 'game-lab/docs/Промты для нейронки/Персонажи и способности — всё.md';
const ART = 'game-lab/docs/Промты для нейронки/Артефакты — всё.md';

const problems = [];

if (!fs.existsSync(DOC)) {
  console.log('НЕТ ДОКУМЕНТА: ' + DOC);
  process.exit(1);
}

const doc = fs.readFileSync(DOC, 'utf8');

for (const ch of D.CHARACTERS) {
  if (!doc.includes(ch.full)) problems.push('персонаж не упомянут: ' + ch.full);
  for (const ab of ch.abilities) {
    if (!doc.includes(ab.name)) problems.push('способность не упомянута: ' + ch.name + ' — ' + ab.name);
  }
}

if (fs.existsSync(ART)) {
  const art = fs.readFileSync(ART, 'utf8');
  for (const a of D.ARTIFACTS) {
    if (!art.includes(a.name)) problems.push('артефакт не упомянут: ' + a.name);
  }
} else {
  problems.push('нет документа артефактов');
}

const counts = {
  characters: D.CHARACTERS.length,
  abilities: D.CHARACTERS.reduce((s, c) => s + c.abilities.length, 0),
  artifacts: D.ARTIFACTS.length
};

console.log('данные: персонажей ' + counts.characters + ', способностей ' + counts.abilities + ', артефактов ' + counts.artifacts);

if (problems.length) {
  console.log('РАСХОЖДЕНИЯ:');
  for (const p of problems) console.log('  ' + p);
  process.exit(1);
}

console.log('документы совпадают с данными');
