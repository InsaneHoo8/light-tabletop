/* Раскладывает разовые скрипты правок в архив, оставляя рабочие инструменты на месте. */

import fs from 'node:fs';
import path from 'node:path';

const TOOLS = 'game-lab/tools';
const ARCHIVE = path.join(TOOLS, 'archive');

const KEEP = new Set([
  'gen-prompt-docs.mjs',
  'gen-rules-doc.mjs',
  'gen-core-docs.mjs',
  'md2docx.mjs',
  'sim-report.mjs',
  'make-meta-xlsx.mjs',
  'make-winrate-xlsx.mjs',
  'make-changelog.mjs',
  'publish.mjs',
  'numbers-ru.mjs',
  'desc-from-ops.mjs',
  'migrate-docs.mjs',
  'verify-docs.mjs',
  'zip-folder.ps1',
  'build-doc.ps1',
  'docx2md.ps1'
]);

fs.mkdirSync(ARCHIVE, { recursive: true });

let moved = 0;
let kept = 0;
for (const entry of fs.readdirSync(TOOLS, { withFileTypes: true })) {
  if (!entry.isFile()) continue;
  const name = entry.name;
  if (!name.endsWith('.mjs')) { kept++; continue; }
  if (KEEP.has(name)) { kept++; continue; }
  fs.renameSync(path.join(TOOLS, name), path.join(ARCHIVE, name));
  moved++;
}

console.log('в архив: ' + moved + ', оставлено в tools: ' + kept);
