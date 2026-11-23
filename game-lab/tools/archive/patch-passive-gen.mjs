import fs from 'node:fs';

const p = 'game-lab/tools/gen-prompt-docs.mjs';
let src = fs.readFileSync(p, 'utf8');

const anchorA = "  lines.push(`**${statsLine(c)}**`);\n  lines.push('');\n  lines.push('## Способности');";
const replA = "  lines.push(`**${statsLine(c)}**`);\n  lines.push('');\n  if (c.passive) {\n    lines.push(`**Пассивка. ${c.passive}**`);\n    lines.push('');\n  }\n  lines.push('## Способности');";

if (!src.includes(anchorA)) {
  console.log('якорь А не найден');
} else {
  src = src.replace(anchorA, replA);
  console.log('сводный блок обновлён');
}

const anchorB = "const lines = [`# ${c.full}`, '', c.text, '', `**${statsLine(c)}**`, '', '## Способности', ''];";
const replB = "const lines = [`# ${c.full}`, '', c.text, '', `**${statsLine(c)}**`, '', c.passive ? `**Пассивка. ${c.passive}**` : '', '', '## Способности', ''];";

if (!src.includes(anchorB)) {
  console.log('якорь Б не найден');
} else {
  src = src.replace(anchorB, replB);
  console.log('карточка обновлена');
}

fs.writeFileSync(p, src, 'utf8');
