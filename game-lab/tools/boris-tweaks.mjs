import fs from 'node:fs';

const path = 'game-lab/arena/cards.js';
let src = fs.readFileSync(path, 'utf8');

function replaceByName(name, literal) {
  const at = src.indexOf(`name: '${name}'`);
  if (at < 0) throw new Error('не найдено: ' + name);
  const start = src.lastIndexOf('{', at);
  let depth = 0;
  let end = start;
  for (let i = start; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  src = src.slice(0, start) + literal + src.slice(end);
  console.log('обновлено: ' + name);
}

replaceByName(
  'Закуска',
  "{ id: 'zakuska', name: 'Закуска', cost: 1, needArtifacts: 2, desc: 'сбрасывает два артефакта, лечит четыре здоровья и одну менталку', ops: [{ t: 'discardArtifact', who: 'self', n: 2 }, { t: 'heal', who: 'self', n: 4 }, { t: 'mental', who: 'self', n: 1 }] }"
);

replaceByName(
  'Тост за здравие',
  "{ id: 'tost', name: 'Тост за здравие', cost: 2, target: true, desc: 'четыре здоровья себе и два выбранному игроку', ops: [{ t: 'heal', who: 'self', n: 4 }, { t: 'heal', who: 'target', n: 2 }] }"
);

replaceByName(
  'Драка со столбом',
  "{ id: 'draka', name: 'Драка со столбом', cost: 2, desc: 'по четыре урона обоим соседям и два себе', ops: [{ t: 'dmg', who: 'neighbors', n: 4 }, { t: 'dmg', who: 'self', n: 2, pierce: true }] }"
);

fs.writeFileSync(path, src, 'utf8');

/* движок: сброс нескольких артефактов и проверка требования */
const epath = 'game-lab/arena/engine.js';
let e = fs.readFileSync(epath, 'utf8');

if (!e.includes('needArtifacts')) {
  e = e.replace(
    `    var needT = needsTarget(def);`,
    `    if (ab.needArtifacts && p.hand.length < ab.needArtifacts) {
      return { ok: false, text: 'Нужно артефактов в руке: ' + ab.needArtifacts + ', есть ' + p.hand.length + '.' };
    }
    var needT = needsTarget(def);`
  );
  e = e.replace(
    `      case 'discardArtifact':
        for (var dca = 0; dca < targets.length; dca++) {
          var tdc = s.players[targets[dca]];
          if (!tdc.hand.length) {
            events.push('Артефактов нет.');
            continue;
          }
          var dropped = tdc.hand.splice(Math.floor(rand(s) * tdc.hand.length), 1)[0];
          s.discard.push(dropped);
          events.push(tdc.name + ' сбрасывает ' + artifactById(dropped).name + '.');
        }
        break;`,
    `      case 'discardArtifact':
        var dcountA = op.n || 1;
        for (var dca = 0; dca < targets.length; dca++) {
          var tdc = s.players[targets[dca]];
          if (!tdc.hand.length) {
            events.push('Артефактов нет.');
            continue;
          }
          for (var dcA = 0; dcA < dcountA; dcA++) {
            if (!tdc.hand.length) break;
            var dropped = tdc.hand.splice(Math.floor(rand(s) * tdc.hand.length), 1)[0];
            s.discard.push(dropped);
            events.push(tdc.name + ' сбрасывает ' + artifactById(dropped).name + '.');
          }
        }
        break;`
  );
  fs.writeFileSync(epath, e, 'utf8');
  console.log('движок: сброс нескольких артефактов');
}

/* бот: не предлагать карту без нужного числа артефактов */
let e2 = fs.readFileSync(epath, 'utf8');
if (!e2.includes('vdef.needArtifacts') && !e2.includes('ab.needArtifacts && p.hand.length < ab.needArtifacts) continue')) {
  e2 = e2.replace(
    `      if (p.noAbilities > 0) continue;`,
    `      if (p.noAbilities > 0) continue;
      if (ab.needArtifacts && p.hand.length < ab.needArtifacts) continue;`
  );
  fs.writeFileSync(epath, e2, 'utf8');
  console.log('бот: учитывает требование артефактов');
}
