/* Мета-данные в xlsx: персонажи в одной строке сверху, под каждым два столбца — способности и артефакты. */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const D = require('../arena/game-data.js');

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('нужно: node make-meta-xlsx.mjs <куда.xlsx> <слепок.json> [ещё слепки...]');
  process.exit(1);
}

const outPath = args[0];
const files = args.slice(1);
const dumps = files.map((f) => JSON.parse(fs.readFileSync(f, 'utf8')));

const abilityAgg = new Map();
const artifactAgg = new Map();
const charAgg = new Map();
const perCharArtifacts = new Map();
const stolenAgg = new Map();
let games = 0;

for (const d of dumps) {
  games += d.games || 0;
  for (const c of d.characters) {
    if (!charAgg.has(c.name)) {
      charAgg.set(c.name, { name: c.name, hp: c.hp, dmg: c.dmg, mental: c.mental, mana: c.mana, handLimit: c.handLimit, wins: 0, played: 0 });
    }
    const a = charAgg.get(c.name);
    a.wins += c.wins;
    a.played += c.played;
  }
  for (const a of d.abilities) {
    const key = a.owner + '::' + a.name;
    if (!abilityAgg.has(key)) abilityAgg.set(key, { owner: a.owner, name: a.name, cost: a.cost, desc: a.desc, uses: 0 });
    abilityAgg.get(key).uses += a.uses;
  }
  for (const a of d.artifacts) {
    if (!artifactAgg.has(a.name)) artifactAgg.set(a.name, { name: a.name, world: a.world, cost: a.cost, desc: a.desc, uses: 0, exchanges: 0 });
    artifactAgg.get(a.name).uses += a.uses;
    artifactAgg.get(a.name).exchanges += a.exchanges;
  }
  for (const st of d.stolen || []) {
    const parts = String(st.key).split('::');
    const thief = parts[0];
    const cardName = parts[1];
    if (!stolenAgg.has(thief)) stolenAgg.set(thief, new Map());
    const m = stolenAgg.get(thief);
    m.set(cardName, (m.get(cardName) || 0) + st.count);
  }
  for (const row of d.artifactLeaders || []) {
    if (!perCharArtifacts.has(row.name)) perCharArtifacts.set(row.name, new Map());
    const m = perCharArtifacts.get(row.name);
    for (const [name, n] of row.top || []) m.set(name, (m.get(name) || 0) + n);
  }
}

const WORLD_RU = { fantasy: 'фэнтези', cyber: 'киберпанк', space: 'космос', earth404: 'Земля 404' };

const chars = Array.from(charAgg.values()).sort((a, b) => b.wins / Math.max(1, b.played) - a.wins / Math.max(1, a.played));

function esc(s) {
  return String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function colName(n) {
  let s = '';
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

const cells = [];
function put(row, col, text, bold) {
  cells.push({ r: row, c: col, v: text, b: !!bold });
}

const merges = [];
let col = 1;

for (const ch of chars) {
  const left = col;
  const right = col + 1;

  put(1, left, ch.name, true);
  put(2, left, `Здоровье ${ch.hp}, урон ${ch.dmg}, менталка ${ch.mental}, энергия ${ch.mana}, рука ${ch.handLimit}`);
  put(3, left, 'Способности', true);
  put(3, right, 'Артефакты', true);

  merges.push(`${colName(left)}1:${colName(right)}1`);
  merges.push(`${colName(left)}2:${colName(right)}2`);

  const own = Array.from(abilityAgg.values()).filter((a) => a.owner === ch.name).sort((a, b) => b.uses - a.uses);
  const arts = Array.from((perCharArtifacts.get(ch.name) || new Map()).entries()).sort((a, b) => b[1] - a[1]);

  /* столбец способностей: свои карты, затем сворованные */
  const abilityRows = own.map((a) => `${a.name} — ${a.cost} энергии — ${a.desc} — применений ${a.uses}`);
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
      abilityRows.push(`— ${cardName} — ${cost}применений ${count}`);
    }
  }

  const rows = Math.max(abilityRows.length, arts.length);
  for (let i = 0; i < rows; i++) {
    const r = 4 + i;
    if (abilityRows[i]) put(r, left, abilityRows[i]);
    if (arts[i]) {
      const card = artifactAgg.get(arts[i][0]);
      const info = card ? `${card.cost} менталки — ${card.desc}` : '';
      put(r, right, `${arts[i][0]} — ${info} — применений ${arts[i][1]}`);
    }
  }

  col += 2;
}

/* лист */
let maxRow = 0;
for (const c of cells) if (c.r > maxRow) maxRow = c.r;

const byCell = new Map();
for (const c of cells) byCell.set(c.r + ':' + c.c, c);

let sheet = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
sheet += '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">';
sheet += '<sheetViews><sheetView workbookViewId="0" tabSelected="1"/></sheetViews>';
sheet += '<cols>';
for (let i = 1; i <= col; i++) sheet += `<col min="${i}" max="${i}" width="38" customWidth="1"/>`;
sheet += '</cols><sheetData>';

for (let r = 1; r <= maxRow; r++) {
  sheet += `<row r="${r}">`;
  for (let c = 1; c <= col; c++) {
    const cell = byCell.get(r + ':' + c);
    if (!cell) continue;
    const ref = colName(c) + r;
    const style = cell.b ? ' s="1"' : ' s="2"';
    sheet += `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${esc(cell.v)}</t></is></c>`;
  }
  sheet += '</row>';
}
sheet += '</sheetData>';
if (merges.length) {
  sheet += `<mergeCells count="${merges.length}">`;
  for (const m of merges) sheet += `<mergeCell ref="${m}"/>`;
  sheet += '</mergeCells>';
}
sheet += '</worksheet>';

const tmp = 'game-lab/tmp-xlsx';
if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(path.join(tmp, '_rels'), { recursive: true });
fs.mkdirSync(path.join(tmp, 'xl', '_rels'), { recursive: true });
fs.mkdirSync(path.join(tmp, 'xl', 'worksheets'), { recursive: true });

fs.writeFileSync(path.join(tmp, '[Content_Types].xml'),
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
  '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
  '<Default Extension="xml" ContentType="application/xml"/>' +
  '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
  '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
  '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
  '</Types>', 'utf8');

fs.writeFileSync(path.join(tmp, '_rels', '.rels'),
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
  '</Relationships>', 'utf8');

fs.writeFileSync(path.join(tmp, 'xl', 'workbook.xml'),
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
  '<sheets><sheet name="Мета-данные" sheetId="1" r:id="rId1"/></sheets></workbook>', 'utf8');

fs.writeFileSync(path.join(tmp, 'xl', '_rels', 'workbook.xml.rels'),
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
  '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
  '</Relationships>', 'utf8');

fs.writeFileSync(path.join(tmp, 'xl', 'styles.xml'),
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<fonts count="2"><font><sz val="10"/><name val="Times New Roman"/></font><font><b/><sz val="10"/><name val="Times New Roman"/></font></fonts>' +
  '<fills count="1"><fill><patternFill patternType="none"/></fill></fills>' +
  '<borders count="1"><border/></borders>' +
  '<cellStyleXfs count="1"><xf/></cellStyleXfs>' +
  '<cellXfs count="3"><xf fontId="0"/><xf fontId="1" applyFont="1"/><xf fontId="0" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf></cellXfs>' +
  '</styleSheet>', 'utf8');

fs.writeFileSync(path.join(tmp, 'xl', 'worksheets', 'sheet1.xml'), sheet, 'utf8');

fs.mkdirSync(path.dirname(outPath), { recursive: true });
if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
execFileSync('powershell.exe', [
  '-NoProfile', '-ExecutionPolicy', 'Bypass',
  '-File', path.resolve('game-lab/tools/zip-folder.ps1'),
  '-Folder', path.resolve(tmp),
  '-Out', path.resolve(outPath)
], { stdio: 'pipe' });

fs.rmSync(tmp, { recursive: true, force: true });
console.log('таблица: ' + outPath);
console.log('персонажей в строке: ' + chars.length + ', столбцов: ' + (col - 1));
