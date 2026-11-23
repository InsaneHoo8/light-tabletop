import fs from 'node:fs';

const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

function rep(old, neu, label) {
  if (!e.includes(old)) throw new Error('не найдено: ' + label);
  e = e.replace(old, neu);
  console.log('ok: ' + label);
}

rep(`  if (opts.mixed) {
    var styles = ['aggro', 'aggro', 'caution', 'caution'];
    for (var mi = styles.length - 1; mi > 0; mi--) {
      var mj = Math.floor(rand(s) * (mi + 1));
      var tmpS = styles[mi];
      styles[mi] = styles[mj];
      styles[mj] = tmpS;
    }
    for (var si = 0; si < s.players.length; si++) {
      s.players[si].style = styles[si] || 'normal';
    }
  }`,
    `  if (opts.mixed) {
    var styles = ['aggro', 'aggro', 'caution', 'caution'];
    for (var mi = styles.length - 1; mi > 0; mi--) {
      var mj = Math.floor(rand(s) * (mi + 1));
      var tmpS = styles[mi];
      styles[mi] = styles[mj];
      styles[mj] = tmpS;
    }
    for (var si = 0; si < s.players.length; si++) {
      s.players[si].style = styles[si] || 'normal';
    }
  }

  /* заданный набор стилей: 'random' означает случайный стиль в этой партии */
  if (opts.styles) {
    var pool = ['aggro', 'caution', 'normal'];
    for (var psi = 0; psi < s.players.length; psi++) {
      var want = opts.styles[psi] || 'normal';
      if (want === 'random') want = pool[Math.floor(rand(s) * pool.length)];
      s.players[psi].style = want;
    }
  }`,
    'набор стилей из опций');

fs.writeFileSync(ep, e, 'utf8');
console.log('движок: стили по местам');

const sp = 'game-lab/tools/sim-report.mjs';
let s = fs.readFileSync(sp, 'utf8').replace(/\r\n/g, '\n');
if (!s.includes('STYLES')) {
  s = s.replace(
    "mixed: process.env.MIXED === '1'",
    "mixed: process.env.MIXED === '1', styles: process.env.STYLES ? process.env.STYLES.split(',') : null"
  );
  fs.writeFileSync(sp, s, 'utf8');
  console.log('отчёт: набор стилей');
}
