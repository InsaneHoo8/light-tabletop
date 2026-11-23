import fs from 'node:fs';

const p = 'game-lab/tools/sim-report.mjs';
let src = fs.readFileSync(p, 'utf8');

/* учёт сворованных */
if (!src.includes('stolenUse')) {
  src = src.replace(
    "const artifactByChar = new Map();",
    "const artifactByChar = new Map();\nconst stolenUse = new Map();\nconst stolenBy = new Map();"
  );

  const oldUse = "if (mv.action === 'ability') { const ab = E.me(s).abilities[mv.picks.ability]; if (ab) use.set(ab.name, (use.get(ab.name)||0)+1); }";
  const newUse = "if (mv.action === 'ability') { const ab = E.me(s).abilities[mv.picks.ability]; if (ab) { use.set(ab.name, (use.get(ab.name)||0)+1); if (ab.stolen) { stolenUse.set(ab.name, (stolenUse.get(ab.name)||0)+1); const kk = p.name + '::' + ab.name; stolenBy.set(kk, (stolenBy.get(kk)||0)+1); } } }";
  if (!src.includes(oldUse)) throw new Error('не найден блок применения способности');
  src = src.replace(oldUse, newUse);

  /* раздел в конце, рядом со статистикой способностей */
  const anchor = "lines.push('## Артефакты: применение и обмен');";
  if (!src.includes(anchor)) throw new Error('не найден раздел артефактов');
  const section = `tail.push('## Сворованные способности');
tail.push('');
if (!stolenUse.size) {
  tail.push('Сворованных способностей в этой партии не применяли.');
} else {
  const rowsStolen = Array.from(stolenBy.entries()).sort((a, b) => b[1] - a[1]);
  for (const [key, count] of rowsStolen) {
    const parts = key.split('::');
    tail.push('- ' + parts[0] + ' применил сворованную «' + parts[1] + '» ' + count + ' раз.');
  }
}
tail.push('');

`;
  src = src.replace(anchor, section + anchor);
}

fs.writeFileSync(p, src, 'utf8');
console.log('отчёт: добавлен учёт сворованных способностей');
