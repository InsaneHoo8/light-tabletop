/* Пересобирает все документы игры, кроме отчётов симуляций. */

import fs from 'node:fs';
import path from 'node:path';
import { buildDocx } from './md2docx.mjs';

const DOCS = 'game-lab/docs';
const GAME = 'C:\\Users\\InsaneHoo8\\Desktop\\Лайтовая настолка';
const SKIP = 'Симуляция игр ботяр';

const out = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === SKIP) continue;
      walk(full);
    } else if (entry.name.endsWith('.md')) {
      const rel = path.relative(DOCS, full);
      const target = path.join(GAME, rel.replace(/\.md$/i, '.docx'));
      fs.mkdirSync(path.dirname(target), { recursive: true });
      try {
        buildDocx(full, target, 'game-lab/rules/template.docx');
        out.push(rel);
      } catch (err) {
        console.log('НЕ СОбран: ' + rel + ' — ' + err.message.split('\n')[0]);
      }
    }
  }
}

walk(DOCS);
console.log('собрано документов: ' + out.length);
