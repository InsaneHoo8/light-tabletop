import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { numbersToWords } from './numbers-ru.mjs';

/* md -> JSON блоков для build-doc.ps1 */

function polish(text) {
  return text.replace(/(^|[.!?])(\*{0,2}\s+)([а-яё])/g, (m, prefix, gap, letter) => prefix + gap + letter.toUpperCase());
}

function parseRuns(rawText) {
  const text = polish(numbersToWords(rawText));
  const runs = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) runs.push({ text: text.slice(last, m.index), bold: false });
    runs.push({ text: m[1], bold: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) runs.push({ text: text.slice(last), bold: false });
  return runs.filter((r) => r.text !== '');
}

export function mdToBlocks(rawMd) {
  const md = String(rawMd).split(String.fromCharCode(96)).join('');
  const lines = md.split(/\r?\n/);
  let title = '';
  const blocks = [];
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    if (line.startsWith('# ')) {
      if (!title) title = line.slice(2).trim();
      else blocks.push({ kind: 'h', text: line.slice(2).trim() });
      continue;
    }
    if (/^#{2,}\s/.test(line)) {
      const headingText = line.slice(3).trim().replace(/^\d+[.)]\s+/, '');
      blocks.push({ kind: 'h', text: headingText });
      continue;
    }
    if (line.startsWith('> ')) {
      blocks.push({ kind: 'p', runs: parseRuns(line.slice(2).trim()) });
      continue;
    }
    if (line.startsWith('- ')) {
      blocks.push({ kind: 'b', runs: parseRuns(line.slice(2).trim()) });
      continue;
    }
    const numbered = line.match(/^\d+[.)]\s+(.*)$/);
    if (numbered) {
      blocks.push({ kind: 'b', runs: parseRuns(numbered[1].trim()) });
      continue;
    }
    blocks.push({ kind: 'p', runs: parseRuns(line.trim()) });
  }
  return { title, blocks };
}

export function buildDocx(mdPath, docxPath, template) {
  const md = fs.readFileSync(mdPath, 'utf8');
  const { title, blocks } = mdToBlocks(md);
  const jsonPath = mdPath.replace(/\.md$/i, '.json');
  fs.writeFileSync(jsonPath, JSON.stringify({ title: title || path.basename(mdPath, '.md'), blocks }, null, 2), 'utf8');
  execFileSync('powershell.exe', [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    path.resolve('game-lab/tools/build-doc.ps1'),
    '-Json',
    path.resolve(jsonPath),
    '-Template',
    path.resolve(template),
    '-Out',
    docxPath
  ], { stdio: 'pipe' });
  fs.unlinkSync(jsonPath);
  return blocks.length;
}

export function syncAll(mdRoot, docxRoot, template) {
  const results = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!entry.name.toLowerCase().endsWith('.md')) continue;
      if (entry.name.startsWith('_') || /^readme/i.test(entry.name)) continue;
      const rel = path.relative(mdRoot, full);
      const docx = path.join(docxRoot, rel.replace(/\.md$/i, '.docx'));
      fs.mkdirSync(path.dirname(docx), { recursive: true });
      const count = buildDocx(full, docx, template);
      results.push({ md: rel, docx, blocks: count });
    }
  }
  walk(mdRoot);
  return results;
}

if (process.argv[2] === 'sync') {
  const out = syncAll('game-lab/docs', process.argv[3] || '.', 'game-lab/rules/template.docx');
  for (const r of out) console.log(r.md + ' -> ' + path.basename(r.docx) + ' (' + r.blocks + ' блоков)');
  console.log('всего: ' + out.length);
}
