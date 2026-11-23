import fs from 'node:fs';

const p = 'game-lab/tools/make-meta-xlsx.mjs';
let src = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

/* 1. Собираем сворованные по персонажу */
if (!src.includes('stolenAgg')) {
  src = src.replace(
    "const perCharArtifacts = new Map();",
    "const perCharArtifacts = new Map();\nconst stolenAgg = new Map();"
  );
  src = src.replace(
    "  for (const row of d.artifactLeaders || []) {",
    `  for (const st of d.stolen || []) {
    const parts = String(st.key).split('::');
    const thief = parts[0];
    const cardName = parts[1];
    if (!stolenAgg.has(thief)) stolenAgg.set(thief, new Map());
    const m = stolenAgg.get(thief);
    m.set(cardName, (m.get(cardName) || 0) + st.count);
  }
  for (const row of d.artifactLeaders || []) {`
  );
}

/* 2. Добавляем строки в столбец способностей */
const oldBlock = `  const rows = Math.max(own.length, arts.length);
  for (let i = 0; i < rows; i++) {
    const r = 4 + i;
    if (own[i]) {
      put(r, left, \`\${own[i].name} — \${own[i].cost} энергии — \${own[i].desc} — применений \${own[i].uses}\`);
    }
    if (arts[i]) {
      const card = artifactAgg.get(arts[i][0]);
      const info = card ? \`\${card.cost} менталки — \${card.desc}\` : '';
      put(r, right, \`\${arts[i][0]} — \${info} — применений \${arts[i][1]}\`);
    }
  }`;

const newBlock = `  /* столбец способностей: свои карты, затем сворованные */
  const abilityRows = own.map((a) => \`\${a.name} — \${a.cost} энергии — \${a.desc} — применений \${a.uses}\`);
  const ownStolen = stolenAgg.get(ch.name);
  if (ownStolen && ownStolen.size) {
    abilityRows.push('Ворованные способности');
    const stolenRows = Array.from(ownStolen.entries()).sort((a, b) => b[1] - a[1]);
    for (const [cardName, count] of stolenRows) {
      let cost = '';
      for (const ch2 of D.CHARACTERS) {
        const found = ch2.abilities.find((x) => x.name === cardName);
        if (found) { cost = found.cost + ' энергии — '; break; }
      }
      abilityRows.push(\`— \${cardName} — \${cost}применений \${count}\`);
    }
  }

  const rows = Math.max(abilityRows.length, arts.length);
  for (let i = 0; i < rows; i++) {
    const r = 4 + i;
    if (abilityRows[i]) put(r, left, abilityRows[i]);
    if (arts[i]) {
      const card = artifactAgg.get(arts[i][0]);
      const info = card ? \`\${card.cost} менталки — \${card.desc}\` : '';
      put(r, right, \`\${arts[i][0]} — \${info} — применений \${arts[i][1]}\`);
    }
  }`;

if (!src.includes(oldBlock)) throw new Error('не найден блок строк таблицы');
src = src.replace(oldBlock, newBlock);

fs.writeFileSync(p, src, 'utf8');
console.log('таблица: добавлена строка «Ворованные способности»');
