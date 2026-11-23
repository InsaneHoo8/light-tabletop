import fs from 'node:fs';

const p = 'game-lab/tools/sim-report.mjs';
let src = fs.readFileSync(p, 'utf8');

const oldBlock = `const artByChar = D.CHARACTERS.map((c) => {
  const per = artifactByChar.get(c.name);
  const total = per ? Array.from(per.values()).reduce((a, b) => a + b, 0) : 0;
  return { c: c, per: per, total: total };
}).sort((a, b) => b.total - a.total);
for (const row of artByChar) {
  const c = row.c;
  if (!row.total) {
    lines.push(\`- \${c.name} (здоровье \${c.hp}, урон \${c.dmg}, менталка \${c.mental}, энергия \${c.mana}, лимит руки \${c.handLimit}) — артефакты не применял.\`);
    continue;
  }
  const top = Array.from(row.per.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const topText = top.map(([name, n]) => \`\${name} — \${n}\`).join(', ');
  lines.push(\`- \${c.name} (здоровье \${c.hp}, урон \${c.dmg}, менталка \${c.mental}, энергия \${c.mana}, лимит руки \${c.handLimit}) — всего применений артефактов \${row.total}. Чаще всего: \${topText}.\`);
}
lines.push('');`;

const newBlock = `const artByChar = D.CHARACTERS.map((c) => {
  const per = artifactByChar.get(c.name);
  const total = per ? Array.from(per.values()).reduce((a, b) => a + b, 0) : 0;
  return { c: c, per: per, total: total };
}).sort((a, b) => b.total - a.total);
for (const row of artByChar) {
  const c = row.c;
  lines.push(\`### \${c.name}\`);
  lines.push('');
  lines.push(\`Здоровье \${c.hp}, урон \${c.dmg}, менталка \${c.mental}, энергия \${c.mana}, лимит руки \${c.handLimit}.\`);
  lines.push('');
  if (!row.total) {
    lines.push('Артефакты не применял.');
    lines.push('');
    continue;
  }
  lines.push(\`Всего применений артефактов: \${row.total}. Порядок — от самого частого к самому редкому.\`);
  lines.push('');
  const ordered = Array.from(row.per.entries()).sort((a, b) => b[1] - a[1]);
  ordered.forEach((item, idx) => {
    const card = E.artifactById(item[0]);
    const cost = card ? card.cost : '?';
    const desc = card ? card.desc : '';
    lines.push(\`- \${idx + 1}. \${item[0]} — цена \${cost} менталки. \${desc}. Применений: \${item[1]}.\`);
  });
  lines.push('');
}`;

if (!src.includes(oldBlock)) throw new Error('не найден блок раздела артефактов');
src = src.replace(oldBlock, newBlock);

fs.writeFileSync(p, src, 'utf8');
console.log('раздел про артефакты переписан');
