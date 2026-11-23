import fs from 'node:fs';

const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

function rep(old, neu, label) {
  if (!e.includes(old)) throw new Error('не найдено: ' + label);
  e = e.replace(old, neu);
  console.log('ok: ' + label);
}

/* стиль у каждого игрока свой */
rep(`  var aggro = s.aggression || 0;
  var caution = s.caution || 0;`,
    `  var aggro = actor.style === 'aggro' ? 1 : (s.aggression || 0);
  var caution = actor.style === 'caution' ? 1 : (s.caution || 0);`,
    'стиль из игрока');

/* поле стиля */
rep(`    shieldCap: ch.shieldCap || 5,`,
    `    style: 'normal',
    shieldCap: ch.shieldCap || 5,`,
    'поле стиля');

/* смешанный режим: двое агрессивных, двое осторожных, порядок случайный */
rep(`  s.deck = shuffle(s, D.ARTIFACTS.map(function (a) { return a.id; }));`,
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

  s.deck = shuffle(s, D.ARTIFACTS.map(function (a) { return a.id; }));`,
    'смешанный режим');

fs.writeFileSync(ep, e, 'utf8');
console.log('движок: стили игроков');
