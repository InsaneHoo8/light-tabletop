import fs from 'node:fs';

/* ---------- данные: лимит руки артефактов ---------- */
const cp = 'game-lab/arena/cards.js';
let c = fs.readFileSync(cp, 'utf8').replace(/\r\n/g, '\n');

const LIMITS = { grog: 4, mirai: 6, zhulien: 6, omnis: 6 };
const chars = ['mirai', 'hrom', 'glyuk', 'borya', 'lyusya', 'grigori', 'mag', 'grog', 'zhulien', 'omnis', 'heil', 'etkora'];

for (const id of chars) {
  const at = c.indexOf(`id: '${id}'`);
  if (at < 0) throw new Error('нет персонажа ' + id);
  const end = c.indexOf('abilities: [', at);
  let block = c.slice(at, end);
  const limit = LIMITS[id] || 5;
  if (/artifactLimit: \d+/.test(block)) {
    block = block.replace(/artifactLimit: \d+/, 'artifactLimit: ' + limit);
  } else {
    block = block.replace(/(handLimit: \d+,)/, `$1 artifactLimit: ${limit},`);
  }
  c = c.slice(0, at) + block + c.slice(end);
}
fs.writeFileSync(cp, c, 'utf8');
console.log('данные: лимит артефактов проставлен');

/* ---------- движок ---------- */
const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

function rep(old, neu, label) {
  if (!e.includes(old)) throw new Error('не найдено: ' + label);
  e = e.replace(old, neu);
  console.log('ok: ' + label);
}

rep(`    handLimit: ch.handLimit,`,
    `    handLimit: ch.handLimit,
    artifactLimit: ch.artifactLimit || 5,`,
    'поле лимита артефактов');

/* взятие */
rep(`  } else if (actionId === 'take') {
    if (!s.deck.length) reshuffleDeck(s, events);`,
    `  } else if (actionId === 'take') {
    if (p.hand.length >= p.artifactLimit) return { ok: false, text: 'Рука артефактов полна: ' + p.artifactLimit + '.' };
    if (!s.deck.length) reshuffleDeck(s, events);`,
    'запрет брать сверх лимита');

/* добор картой */
rep(`      case 'drawArtifact':
        for (var dar = 0; dar < op.n; dar++) {
          if (!s.deck.length) reshuffleDeck(s, events);
          if (!s.deck.length) break;
          actor.hand.push(s.deck.shift());
        }`,
    `      case 'drawArtifact':
        for (var dar = 0; dar < op.n; dar++) {
          if (actor.hand.length >= actor.artifactLimit) break;
          if (!s.deck.length) reshuffleDeck(s, events);
          if (!s.deck.length) break;
          actor.hand.push(s.deck.shift());
        }`,
    'добор ограничен лимитом');

/* кража */
rep(`          for (var k = 0; k < (op.n || 1); k++) {
            if (!tsa.hand.length) break;`,
    `          for (var k = 0; k < (op.n || 1); k++) {
            if (!tsa.hand.length) break;
            if (actor.hand.length >= actor.artifactLimit) break;`,
    'кража ограничена лимитом');

/* бот не берёт сверх лимита */
rep(`  if (s.deck.length || s.discard.length) out.push({ action: 'take', picks: {}, score: 1.2 });`,
    `  if ((s.deck.length || s.discard.length) && p.hand.length < p.artifactLimit) out.push({ action: 'take', picks: {}, score: 1.2 });`,
    'бот: лимит артефактов');

fs.writeFileSync(ep, e, 'utf8');
console.log('движок: лимит руки артефактов');
