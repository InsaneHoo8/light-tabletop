/* Полный отчёт по симуляции: действия, способности, артефакты и их эффективность. */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { buildDocx } from './md2docx.mjs';

const require = createRequire(import.meta.url);
const E = require('../arena/engine.js');
const D = require('../arena/game-data.js');

const N = Number(process.argv[2] || 1500);
const COUNT = Number(process.argv[3] || 4);
const MD_DIR = 'game-lab/docs/Симуляция игр ботяр';
const GAME_DIR = process.argv[4] || 'C:\\Users\\InsaneHoo8\\Desktop\\Лайтовая настолка';
const EXPERIMENT = process.argv[5] || '';

const PATCHES = JSON.parse(fs.readFileSync('game-lab/patches.json', 'utf8'));
const PATCH = PATCHES.current;
const PATCH_INFO = PATCHES.patches.find((x) => x.version === PATCH);

const ACTION_WORD = {
  attack: 'обычная атака',
  ability: 'способность',
  useArtifact: 'артефакт',
  take: 'взятие артефакта',
  exchange: 'обмен артефакта',
  pass: 'пропуск хода'
};

function snapshot(s) {
  return s.players.map((p) => ({ hp: p.hp, mana: p.mana, mental: p.mental }));
}

const wins = new Map();
const styleWins = new Map();
const stylePlays = new Map();
const charStyleWins = new Map();
const charStylePlays = new Map();
const plays = new Map();
const actions = new Map();
const actionByChar = new Map();
const artifactByChar = new Map();
const stolenUse = new Map();
const stolenBy = new Map();
const artifactCharCount = new Map();
const abilityUse = new Map();
const abilityEffect = new Map();
const artifactUse = new Map();
const artifactEffect = new Map();
const artifactExchange = new Map();
const damageDealt = new Map();
const abilityPicked = new Map();
const healing = new Map();
const killer = new Map();

let done = 0;
let rounds = 0;
let maxRounds = 0;
let emptyHand = 0;
let firstWin = 0;
let firstPlays = 0;
let draws = 0;

for (let i = 0; i < N; i++) {
  const s = E.newGame({ count: COUNT, seed: 800000 + i, aggression: process.env.AGGRO === '1' ? 1 : 0, caution: process.env.CAUTION === '1' ? 1 : 0, mixed: process.env.MIXED === '1', styles: process.env.STYLES
    ? process.env.STYLES.split(',')
    : (process.env.AGGRO === '1' || process.env.CAUTION === '1' || process.env.MIXED === '1' || process.env.PRIORITY === '1'
        ? null
        : ['random', 'random', 'random', 'random']), preferExtra: process.env.PREFER_EXTRA === '1', preferShield: process.env.PREFER_SHIELD === '1', priority: process.env.PRIORITY === '1', counterAware: process.env.COUNTERS === '1', noArtifactLimit: process.env.NO_ART_LIMIT === '1', comboMode: process.env.COMBO === '1', freeArtifacts: process.env.FREE_ART === '1' });
  const starters = s.players.map((p) => p.name);
  E.runBotsPick(s, -1);
  for (const p of s.players) {
    for (const a of p.abilities) abilityPicked.set(a.name, (abilityPicked.get(a.name) || 0) + 1);
  }

  let guard = 0;
  while (!E.isOver(s) && guard++ < 2000) {
    const p = E.me(s);
    const mv = E.botMove(s, 1);
    if (!mv) break;

    let card = null;
    let stolenFlag = false;
    if (mv.action === 'ability') {
      const ab = p.abilities[mv.picks.ability];
      if (ab) {
        card = ab.name;
        stolenFlag = !!ab.stolen;
      }
    } else if (mv.action === 'useArtifact' || mv.action === 'exchange') {
      const id = p.hand[mv.picks.artifact === undefined ? 0 : mv.picks.artifact];
      if (id) card = E.artifactById(id).name;
    }

    const before = snapshot(s);
    const actorIdx = p.idx;
    const r = E.apply(s, mv.action, mv.picks);
    if (!r.ok) break;
    const after = snapshot(s);

    actions.set(mv.action, (actions.get(mv.action) || 0) + 1);
    const key = p.name;
    if (!actionByChar.has(key)) actionByChar.set(key, new Map());
    const perChar = actionByChar.get(key);
    perChar.set(mv.action, (perChar.get(mv.action) || 0) + 1);

    let dealt = 0;
    let healed = 0;
    for (let j = 0; j < s.players.length; j++) {
      const delta = after[j].hp - before[j].hp;
      if (j === actorIdx) {
        if (delta > 0) healed += delta;
        else dealt += 0;
      } else if (delta < 0) {
        dealt += -delta;
      }
    }

    if (mv.action === 'ability' && card) {
      abilityUse.set(card, (abilityUse.get(card) || 0) + 1);
      if (stolenFlag) {
        stolenUse.set(card, (stolenUse.get(card) || 0) + 1);
        const keySt = p.name + '::' + card;
        stolenBy.set(keySt, (stolenBy.get(keySt) || 0) + 1);
      }
      const eff = abilityEffect.get(card) || { dealt: 0, healed: 0 };
      eff.dealt += dealt;
      eff.healed += healed;
      abilityEffect.set(card, eff);
      damageDealt.set(p.name, (damageDealt.get(p.name) || 0) + dealt);
      healing.set(p.name, (healing.get(p.name) || 0) + healed);
    }
    if (mv.action === 'useArtifact' && card) {
      artifactUse.set(card, (artifactUse.get(card) || 0) + 1);
      const akey = p.name + '::' + card;
      artifactCharCount.set(akey, (artifactCharCount.get(akey) || 0) + 1);
      if (!artifactByChar.has(p.name)) artifactByChar.set(p.name, new Map());
      artifactByChar.get(p.name).set(card, (artifactByChar.get(p.name).get(card) || 0) + 1);
      const eff = artifactEffect.get(card) || { dealt: 0, healed: 0 };
      eff.dealt += dealt;
      eff.healed += healed;
      artifactEffect.set(card, eff);
    }
    if (mv.action === 'exchange' && card) {
      artifactExchange.set(card, (artifactExchange.get(card) || 0) + 1);
    }
  }

  if (!E.isOver(s)) continue;
  if (s.winner === null) {
    draws++;
    continue;
  }
  done++;
  rounds += s.round;
  maxRounds = Math.max(maxRounds, s.round);
  if (s.players.some((p) => p.alive && p.abilities.length === 0)) emptyHand++;
  if (starters[s.winner] === starters[0]) {
    firstWin++;
  }
  firstPlays++;
  wins.set(s.players[s.winner].name, (wins.get(s.players[s.winner].name) || 0) + 1);
  for (var csi = 0; csi < s.players.length; csi++) {
    var csp = s.players[csi];
    var keyCS = csp.name + '|' + (csp.style || 'normal');
    charStylePlays.set(keyCS, (charStylePlays.get(keyCS) || 0) + 1);
    if (csi === s.winner) charStyleWins.set(keyCS, (charStyleWins.get(keyCS) || 0) + 1);
  }
  var winStyle = s.players[s.winner].style || 'normal';
  styleWins.set(winStyle, (styleWins.get(winStyle) || 0) + 1);
  for (var sti = 0; sti < s.players.length; sti++) {
    var stl = s.players[sti].style || 'normal';
    stylePlays.set(stl, (stylePlays.get(stl) || 0) + 1);
  }
  for (const p of s.players) plays.set(p.name, (plays.get(p.name) || 0) + 1);
}

const totalActions = Array.from(actions.values()).reduce((a, b) => a + b, 0);
const pct = (x, total) => ((x / Math.max(1, total)) * 100).toFixed(1).replace('.', ',');

/* суть прогона — попадает в начало имени файла */
function essenceOf() {
  if (process.env.ESSENCE) return process.env.ESSENCE;
  if (process.env.STYLES) return 'Стили ботов ' + process.env.STYLES.split(',').join(', ');
  if (process.env.AGGRO === '1') return 'Стили ботов все агрессивные';
  if (process.env.CAUTION === '1') return 'Стили ботов все осторожные';
  if (process.env.MIXED === '1') return 'Стили ботов смешанный стол';
  if (process.env.PRIORITY === '1') return 'Поведение строгий порядок';
  if (process.env.PREFER_EXTRA === '1') return 'Поведение приоритет дополнительному действию';
  if (process.env.PREFER_SHIELD === '1') return 'Поведение приоритет щиту';
  if (process.env.COUNTERS === '1') return 'Поведение контр-оценка';
  if (process.env.NO_ART_LIMIT === '1') return 'Без лимита руки артефактов';
  return 'Патч ' + PATCH;
}

const ESSENCE = essenceOf().replace(/[:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim();

const now = new Date();
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const DAY_WORDS = ['нулевого', 'первого', 'второго', 'третьего', 'четвёртого', 'пятого', 'шестого', 'седьмого', 'восьмого', 'девятого', 'десятого',
  'одиннадцатого', 'двенадцатого', 'тринадцатого', 'четырнадцатого', 'пятнадцатого', 'шестнадцатого', 'семнадцатого', 'восемнадцатого', 'девятнадцатого', 'двадцатого',
  'двадцать первого', 'двадцать второго', 'двадцать третьего', 'двадцать четвёртого', 'двадцать пятого', 'двадцать шестого', 'двадцать седьмого', 'двадцать восьмого', 'двадцать девятого', 'тридцатого', 'тридцать первого'];
const dateWords = `${DAY_WORDS[now.getDate()]} ${MONTHS[now.getMonth()]} ${now.getFullYear()} года`;
const stamp = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;

const lines = [];
lines.push(`# Симуляция ботов: патч ${PATCH}`);
lines.push('');
lines.push(`Симуляция проведена в патче ${PATCH} от ${PATCH_INFO ? PATCH_INFO.date : ""}.`);
lines.push('');
if (PATCH_INFO) {
  lines.push(`Что в патче: ${PATCH_INFO.title}.`);
  lines.push('');
  for (const ch of PATCH_INFO.changes) lines.push(`- ${ch}.`);
  lines.push('');
}
if (EXPERIMENT) {
  lines.push(`**Экспериментальное изменение этого прогона: ${EXPERIMENT}.**`);
  lines.push('');
  lines.push('Это разовая проверка, в устойчивый патч она не входит.');
  lines.push('');
}
lines.push(`Дата прогона: ${dateWords}.`);
lines.push('');
lines.push('');
lines.push('## Условия');
lines.push('');
lines.push(`Сыграно партий: ${N}. Игроков за столом: ${COUNT}. Завершилось победой: ${done}. Ничьих: ${draws}.`);
lines.push(`Средняя длина партии: ${(rounds / Math.max(1, done)).toFixed(1).replace('.', ',')} круга. Самая длинная: ${maxRounds} кругов.`);
lines.push(`Партий, где у живого игрока кончились карты в руке: ${emptyHand}.`);
lines.push(`Побед первого места по порядку посадки: ${firstWin} из ${firstPlays} (${pct(firstWin, firstPlays)}%).`);
lines.push('');

lines.push('## Победы по стилю игры');
lines.push('');
if ([...stylePlays.keys()].some((k) => k !== 'normal')) {
  const styleNames = { aggro: 'агрессивный', caution: 'осторожный', normal: 'обычный' };
  const rowsStyle = Array.from(stylePlays.entries()).sort((a, b) => (styleWins.get(b[0]) || 0) / b[1] - (styleWins.get(a[0]) || 0) / a[1]);
  for (const [st, cnt] of rowsStyle) {
    const w = styleWins.get(st) || 0;
    lines.push('- ' + (styleNames[st] || st) + ' — ' + ((w / Math.max(1, cnt)) * 100).toFixed(1).replace('.', ',') + '% (' + w + ' из ' + cnt + ').');
  }
} else {
  lines.push('Все боты играли одинаково.');
}
lines.push('');

lines.push('## Победы по персонажам');
lines.push('');
const rows = D.CHARACTERS.map((c) => ({
  name: c.name,
  hp: c.hp,
  dmg: c.dmg,
  rate: ((wins.get(c.name) || 0) / Math.max(1, plays.get(c.name) || 1)) * 100,
  wins: wins.get(c.name) || 0,
  played: plays.get(c.name) || 0
})).sort((a, b) => b.rate - a.rate);
for (const r of rows) {
  lines.push(`- ${r.name} — ${r.rate.toFixed(1).replace('.', ',')}% (${r.wins} из ${r.played}), здоровье ${r.hp}, урон ${r.dmg}.`);
}
lines.push('');

lines.push('## Какие действия совершались');
lines.push('');
const actionRows = Array.from(actions.entries()).sort((a, b) => b[1] - a[1]);
for (const [action, count] of actionRows) {
  lines.push(`- ${ACTION_WORD[action] || action} — ${count} раз, ${pct(count, totalActions)}% от всех действий.`);
}
lines.push('');

lines.push('## Кто что делал');
lines.push('');
for (const c of D.CHARACTERS) {
  const per = actionByChar.get(c.name);
  if (!per) continue;
  const parts = Array.from(per.entries()).sort((a, b) => b[1] - a[1]).map(([a, n]) => `${ACTION_WORD[a] || a} — ${n}`);
  lines.push(`- ${c.name}: ${parts.join(', ')}.`);
}
lines.push('');

const tail = [];

tail.push('## Кто чаще всего применял артефакты');
tail.push('');
const artByChar = D.CHARACTERS.map((c) => {
  const per = artifactByChar.get(c.name);
  const total = per ? Array.from(per.values()).reduce((a, b) => a + b, 0) : 0;
  return { c: c, per: per, total: total };
}).sort((a, b) => b.total - a.total);
for (const row of artByChar) {
  const c = row.c;
  if (!row.total) {
    tail.push(`**${c.name}.** Артефакты не применял.`);
    tail.push('');
    continue;
  }
  tail.push(`**${c.name}.** Всего применений артефактов: ${row.total}. Порядок — от самого частого к самому редкому.`);
  tail.push('');
  const ordered = Array.from(row.per.entries()).sort((a, b) => b[1] - a[1]);
  ordered.forEach((item, idx) => {
    const card = D.ARTIFACTS.find((x) => x.name === item[0]);
    const cost = card ? card.cost : '?';
    const desc = card ? card.desc : '';
    tail.push(`- ${item[0]} — менталка: ${cost}. ${desc}. Применений: ${item[1]}.`);
  });
  tail.push('');
}
tail.push('## Способности: как часто и насколько результативно');
tail.push('');
tail.push('Эффективность — средний урон по чужим плюс лечение себя за одно применение.');
tail.push('');
const allAbilities = [];
for (const c of D.CHARACTERS) for (const a of c.abilities) allAbilities.push({ owner: c.name, a });
allAbilities.sort((x, y) => (abilityUse.get(y.a.name) || 0) - (abilityUse.get(x.a.name) || 0));
for (const { owner, a } of allAbilities) {
  const uses = abilityUse.get(a.name) || 0;
  const picked = abilityPicked.get(a.name) || 0;
  const eff = abilityEffect.get(a.name) || { dealt: 0, healed: 0 };
  if (!uses && !picked) {
    tail.push(`- ${a.name} (${owner}) — не брали в руку ни разу.`);
    continue;
  }
  if (!uses) {
    tail.push(`- ${a.name} (${owner}) — брали в руку ${picked} раз, но не применили ни разу.`);
    continue;
  }
  const dmgAvg = (eff.dealt / uses).toFixed(1).replace('.', ',');
  const healAvg = (eff.healed / uses).toFixed(1).replace('.', ',');
  tail.push(`- ${a.name} (${owner}) — применений ${uses}, в руку брали ${picked}. Урон за применение: ${dmgAvg}, лечение: ${healAvg}.`);
}
tail.push('');

tail.push('## Сворованные способности');
tail.push('');
if (!stolenUse.size) {
  tail.push('Сворованных способностей в этой партии не применяли.');
} else {
  const rowsStolen = Array.from(stolenBy.entries()).sort((a, b) => b[1] - a[1]);
  for (const [key, count] of rowsStolen) {
    const parts = key.split('::');
    tail.push('- ' + parts[0] + ' применил сворованную «' + parts[1] + '» ' + count + ' раз.');
  }
}
tail.push('');

tail.push('## Артефакты: применение и обмен');
tail.push('');
const allArts = D.ARTIFACTS.slice().sort((a, b) => (artifactUse.get(b.name) || 0) - (artifactUse.get(a.name) || 0));
for (const a of allArts) {
  const uses = artifactUse.get(a.name) || 0;
  const exchanges = artifactExchange.get(a.name) || 0;
  const eff = artifactEffect.get(a.name) || { dealt: 0, healed: 0 };
  if (!uses && !exchanges) {
    tail.push(`- ${a.name} (${D.WORLDS[a.world]}) — не применяли и не обменивали.`);
    continue;
  }
  const dmgAvg = uses ? (eff.dealt / uses).toFixed(1).replace('.', ',') : '0';
  const healAvg = uses ? (eff.healed / uses).toFixed(1).replace('.', ',') : '0';
  tail.push(`- ${a.name} (${D.WORLDS[a.world]}, цена ${a.cost}) — применений ${uses}, обменов ${exchanges}. Урон за применение: ${dmgAvg}, лечение: ${healAvg}.`);
}
tail.push('');

lines.push('## Урон и лечение по персонажам');
lines.push('');
for (const r of rows) {
  lines.push(`- ${r.name} — нанёс способностями ${damageDealt.get(r.name) || 0} урона, вылечил себя на ${healing.get(r.name) || 0}.`);
}
lines.push('');
lines.push(...tail);

lines.push('## Как читать отчёт');
lines.push('');
lines.push('Эффективность считается по изменению здоровья непосредственно после действия: урон по чужим игрокам складывается, лечение самого действующего вычитается как положительное. Отложенный урон, запреты и кражи в эту цифру не попадают, поэтому у контрольных карт она занижена.');
lines.push('');
lines.push('Бот играет жадно и близоруко: он оценивает варианты по одному ходу и не строит комбинаций. Поэтому низкая эффективность карты означает в первую очередь то, что бот не умеет её готовить.');

fs.mkdirSync(MD_DIR, { recursive: true });
const safeStamp = stamp.replace(/[.:]/g, '-').replace(/\s+/g, ' ');
const patchFolder = 'Патч ' + PATCH;
fs.mkdirSync(path.join(MD_DIR, patchFolder), { recursive: true });
const mdPath = path.join(MD_DIR, patchFolder, `${ESSENCE} — Симуляция ${PATCH} ${safeStamp}.md`);
fs.writeFileSync(mdPath, lines.join('\n') + '\n', 'utf8');
console.log('отчёт: ' + mdPath);


/* машинный слепок для таблиц */
const DATA_DIR = 'game-lab/sim-data';
fs.mkdirSync(DATA_DIR, { recursive: true });
const dumpName = (PATCH + ' ' + safeStamp).replace(/[.:]/g, '-') + '.json';

const dump = {
  patch: PATCH,
  experiment: EXPERIMENT,
  games: N,
  players: COUNT,
  finished: done,
  draws: draws,
  avgRounds: Number((rounds / Math.max(1, done)).toFixed(1)),
  maxRounds: maxRounds,
  emptyHand: emptyHand,
  firstSeatWin: firstWin,
  firstSeatPlays: firstPlays,
  characters: D.CHARACTERS.map((c) => ({
    id: c.id,
    name: c.name,
    full: c.full,
    hp: c.hp,
    dmg: c.dmg,
    mental: c.mental,
    mana: c.mana,
    handLimit: c.handLimit,
    wins: wins.get(c.name) || 0,
    played: plays.get(c.name) || 0
  })),
  abilities: [],
  artifacts: [],
  actions: Array.from(actions.entries()).map(([k, v]) => ({ action: k, count: v })),
  actionsByChar: Array.from(actionByChar.entries()).map(([name, m]) => ({
    name: name,
    actions: Array.from(m.entries()).map(([k, v]) => ({ action: k, count: v }))
  })),
  artifactLeaders: artByChar.map((row) => ({
    name: row.c.name,
    hp: row.c.hp,
    dmg: row.c.dmg,
    total: row.total,
    top: Array.from(row.per ? row.per.entries() : []).sort((a, b) => b[1] - a[1])
  })),
  stolen: Array.from(stolenBy.entries()).map(([k, v]) => ({ key: k, count: v })),
  styleMatrix: Array.from(charStylePlays.entries()).map(([k, plays]) => {
    const parts = k.split('|');
    return { name: parts[0], style: parts[1], wins: charStyleWins.get(k) || 0, plays: plays };
  }),
  damageByChar: Array.from(damageDealt.entries()).map(([k, v]) => ({ name: k, value: v })),
  healByChar: Array.from(healing.entries()).map(([k, v]) => ({ name: k, value: v }))
};

for (const c of D.CHARACTERS) {
  for (const a of c.abilities) {
    dump.abilities.push({
      owner: c.name,
      name: a.name,
      cost: a.cost,
      desc: a.desc || '',
      uses: abilityUse.get(a.name) || 0,
      picked: abilityPicked.get(a.name) || 0
    });
  }
}
for (const a of D.ARTIFACTS) {
  dump.artifacts.push({
    name: a.name,
    world: a.world,
    cost: a.cost,
    desc: a.desc,
    uses: artifactUse.get(a.name) || 0,
    exchanges: artifactExchange.get(a.name) || 0
  });
}
fs.writeFileSync(path.join(DATA_DIR, dumpName), JSON.stringify(dump, null, 2), 'utf8');
console.log('слепок: ' + path.join(DATA_DIR, dumpName));

/* сборка docx в папку игры */
const docxDir = path.join(GAME_DIR, 'Симуляция игр ботяр');
fs.mkdirSync(docxDir, { recursive: true });
fs.mkdirSync(path.join(docxDir, patchFolder), { recursive: true });
const docxPath = path.join(docxDir, patchFolder, `${ESSENCE} — Симуляция ${PATCH} ${safeStamp}.docx`);
try {
  buildDocx(mdPath, docxPath, 'game-lab/rules/template.docx');
} catch (e) {
  console.log('docx не собран: ' + (e.stdout ? e.stdout.toString() : e.message));
}
console.log('готово: ' + docxPath);
