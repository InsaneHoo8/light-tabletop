import fs from 'node:fs';

const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

function rep(old, neu, label) {
  if (!e.includes(old)) throw new Error('не найдено: ' + label);
  e = e.replace(old, neu);
  console.log('ok: ' + label);
}

rep(`function makePlayer(idx, ch) {`,
    `function makePlayer(idx, ch, noArtifactLimit) {`,
    'параметр в makePlayer');

rep(`    artifactLimit: ch.artifactLimit || 5,`,
    `    artifactLimit: noArtifactLimit ? 99 : (ch.artifactLimit || 5),`,
    'лимит без ограничения');

rep(`    s.players.push(makePlayer(i, ch));`,
    `    s.players.push(makePlayer(i, ch, !!opts.noArtifactLimit));`,
    'передача флага');

fs.writeFileSync(ep, e, 'utf8');
console.log('движок: флаг отключения лимита');

const sp = 'game-lab/tools/sim-report.mjs';
let s = fs.readFileSync(sp, 'utf8').replace(/\r\n/g, '\n');
if (!s.includes('NO_ART_LIMIT')) {
  s = s.replace(
    "counterAware: process.env.COUNTERS === '1'",
    "counterAware: process.env.COUNTERS === '1', noArtifactLimit: process.env.NO_ART_LIMIT === '1'"
  );
  fs.writeFileSync(sp, s, 'utf8');
  console.log('отчёт: флаг лимита');
}
