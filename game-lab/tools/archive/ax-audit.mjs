/* Автопроверка доступности демо в настоящем Chrome через DevTools Protocol.
   Смотрит дерево доступности (то, что видит экранный диктор), клавиши,
   живую область, фокус и контраст. Запуск: node game-lab/tools/ax-audit.mjs */
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const pagePath = path.join(here, '..', 'demo', 'index.html');
const pageUrl = pathToFileURL(pagePath).href;

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];
const chrome = CHROME_CANDIDATES.find((p) => p && fs.existsSync(p));
if (!chrome) {
  console.error('Не найден Chrome или Edge.');
  process.exit(2);
}

const port = 9400 + Math.floor(Math.random() * 400);
const userDir = path.join(os.tmpdir(), 'ax-audit-' + Date.now());
const args = [
  '--headless=new',
  '--remote-debugging-port=' + port,
  '--user-data-dir=' + userDir,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  '--disable-extensions',
  '--allow-file-access-from-files',
  '--force-device-scale-factor=1',
  '--window-size=1280,1000',
  pageUrl
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const child = spawn(chrome, args, { stdio: 'ignore', windowsHide: true });
let ws = null;
let msgId = 0;
const pending = new Map();
const consoleErrors = [];

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        reject(new Error('таймаут CDP: ' + method));
      }
    }, 15000);
  });
}

async function waitForTarget() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch('http://127.0.0.1:' + port + '/json/list');
      const list = await res.json();
      const page = list.find((t) => t.type === 'page' && t.url.startsWith('file:'));
      if (page && page.webSocketDebuggerUrl) return page;
    } catch (e) {}
    await sleep(250);
  }
  throw new Error('Chrome не отдал страницу за 15 секунд');
}

function cleanup() {
  try {
    if (ws) ws.close();
  } catch (e) {}
  try {
    execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } catch (e) {
    try {
      child.kill();
    } catch (e2) {}
  }
  try {
    fs.rmSync(userDir, { recursive: true, force: true });
  } catch (e) {}
}

const results = [];
function check(name, cond, detail) {
  results.push({ name, ok: !!cond, detail });
  console.log((cond ? 'OK   ' : 'FAIL ') + name + (!cond && detail ? ' -> ' + detail : ''));
}

async function main() {
  const target = await waitForTarget();
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true });
    ws.addEventListener('error', rej, { once: true });
  });
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
      return;
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(msg.params.exceptionDetails.text + ' ' + (msg.params.exceptionDetails.exception?.description || ''));
    }
    if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
      consoleErrors.push(msg.params.entry.text);
    }
  });

  await send('Runtime.enable');
  await send('Log.enable');
  await send('Accessibility.enable');
  await send('Page.enable');

  // Ждём полной загрузки и работы скриптов.
  for (let i = 0; i < 40; i++) {
    const r = await send('Runtime.evaluate', {
      expression: 'document.readyState + "|" + (window.__demo ? "app" : "noapp")',
      returnByValue: true
    });
    if (r.result.value === 'complete|app') break;
    await sleep(150);
  }
  await sleep(400);

  const evalJS = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + r.exceptionDetails.exception?.description);
    return r.result.value;
  };

  /* --- 1. Язык документа: от него зависит произношение диктора --- */
  const lang = await evalJS('document.documentElement.lang');
  check('язык страницы указан и это ru', lang === 'ru', String(lang));
  const title = await evalJS('document.title');
  check('у страницы есть заголовок', typeof title === 'string' && title.length > 5, String(title));

  /* --- 2. Дерево доступности --- */
  const { nodes } = await send('Accessibility.getFullAXTree');
  const roleOf = (n) => (n.role && n.role.value) || '';
  const nameOf = (n) => (n.name && n.name.value) || '';
  const propOf = (n, p) => {
    const found = (n.properties || []).find((x) => x.name === p);
    return found ? found.value.value : undefined;
  };

  const liveNodes = nodes.filter((n) => roleOf(n) === 'status');
  check('есть живая область role=status', liveNodes.length === 1, 'найдено ' + liveNodes.length);
  if (liveNodes.length) {
    const ln = liveNodes[0];
    const atomic = propOf(ln, 'atomic');
    check('живая область вежливая (polite)', propOf(ln, 'live') === 'polite', String(propOf(ln, 'live')));
    check('живая область атомарна', atomic === true || atomic === 'true', String(atomic));
    // Текст живой области лежит в дочерних узлах, а не в её имени — так же его читает диктор.
    const byId = new Map(nodes.map((n) => [n.nodeId, n]));
    const flatten = (node) => {
      if (!node) return '';
      let out = '';
      const kids = node.childIds || [];
      for (const id of kids) {
        const kid = byId.get(id);
        if (!kid) continue;
        if (roleOf(kid) === 'StaticText' || roleOf(kid) === 'InlineTextBox') out += nameOf(kid) + ' ';
        else out += flatten(kid);
      }
      return out;
    };
    const liveText = (flatten(ln) || nameOf(ln)).trim();
    check('живая область содержит готовый текст', liveText.length > 20, JSON.stringify(liveText.slice(0, 120)));
    check('в живой области стартовое сообщение', /Партия/.test(liveText), liveText.slice(0, 120));
  }

  const buttons = nodes.filter((n) => roleOf(n) === 'button');
  check('кнопок не меньше пяти', buttons.length >= 5, 'найдено ' + buttons.length);
  const unnamed = buttons.filter((n) => !nameOf(n).trim());
  check('у всех кнопок есть имя', unnamed.length === 0, 'без имени: ' + unnamed.length);
  const targeted = nodes.filter((n) => propOf(n, 'keyshortcuts'));
  check('у кнопок объявлены горячие клавиши', targeted.length >= 5, 'найдено ' + targeted.length);

  const table = nodes.filter((n) => roleOf(n) === 'table');
  check('счёт оформлен настоящей таблицей', table.length === 1, 'найдено ' + table.length);

  const headings = nodes.filter((n) => roleOf(n) === 'heading');
  check('есть заголовки для навигации диктором', headings.length >= 6, 'найдено ' + headings.length);

  const listItems = nodes.filter((n) => roleOf(n) === 'listitem');
  check('журнал собран списком', listItems.length >= 1, 'найдено ' + listItems.length);

  /* --- 3. Фокус после загрузки --- */
  const activeId = await evalJS('document.activeElement && document.activeElement.getAttribute("data-id")');
  check('фокус стоит на первом действии', activeId === 'gather', String(activeId));

  /* --- 4. Клавиши: цифра, статус, отмена --- */
  const press = async (key, code, wvkc) => {
    await send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key,
      code,
      windowsVirtualKeyCode: wvkc,
      nativeVirtualKeyCode: wvkc,
      text: key.length === 1 ? key : undefined
    });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: wvkc, nativeVirtualKeyCode: wvkc });
    await sleep(150);
  };

  const before = await evalJS('window.__demo.state().you.points + "|" + window.__demo.state().you.res.wood + window.__demo.state().you.res.metal + window.__demo.state().you.res.food');
  await press('1', 'Digit1', 49);
  const afterState = await evalJS('JSON.stringify({phase: window.__demo.state().phase, round: window.__demo.state().round, moves: window.__demo.state().moves})');
  const parsed = JSON.parse(afterState);
  check('цифра 1 выполнила действие', parsed.moves === 1, afterState);
  check('после действия ход перешёл сопернику', parsed.phase === 'bot', afterState);

  const annAfter = await evalJS('window.__demo.announceText()');
  check('в живой области текст хода', /припасы/.test(annAfter), annAfter);
  const logCount = await evalJS('document.getElementById("log").children.length');
  check('журнал получил запись', logCount >= 2, 'записей ' + logCount);

  /* --- 5. Пробел даёт ход сопернику --- */
  await press(' ', 'Space', 32);
  const afterSpace = await evalJS('window.__demo.state().phase');
  check('Пробел отдал ход сопернику и вернул его вам', afterSpace === 'you', String(afterSpace));

  /* --- 6. S выдаёт состояние, R повторяет (и это видно диктору) --- */
  await press('s', 'KeyS', 83);
  const statusText = await evalJS('window.__demo.announceText()');
  check('S проговаривает состояние партии', /Очки: вы|Партия окончена/.test(statusText) && /Действия/.test(statusText), statusText.slice(0, 80));

  await evalJS(
    'window.__muts = 0; window.__obs = new MutationObserver(function(){ window.__muts++; });' +
      'window.__obs.observe(document.getElementById("announce"), {childList:true, characterData:true, subtree:true});'
  );
  await press('r', 'KeyR', 82);
  await sleep(300);
  const muts = await evalJS('window.__muts');
  check('повторное сообщение снова порождает изменение для диктора', muts > 0, 'изменений ' + muts);

  /* --- 7. Отмена хода --- */
  await press('u', 'KeyU', 85);
  const afterUndo = await evalJS('JSON.stringify({round: window.__demo.state().round, moves: window.__demo.state().moves})');
  check('U отменяет ход целиком', JSON.parse(afterUndo).moves === 0, afterUndo);

  /* --- 8. Отказ объясняется словами --- */
  await evalJS('window.__demo.newGame()');
  await press('3', 'Digit3', 51);
  const refuse = await evalJS('window.__demo.announceText()');
  check('на недоступное действие есть объяснение причины', /Нельзя/.test(refuse) && /нужно/.test(refuse), refuse);

  /* --- 9. Контраст и размер текста --- */
  const metrics = await evalJS(`
    (function () {
      function lum(c) {
        var m = c.match(/\\d+(\\.\\d+)?/g).map(Number).slice(0, 3).map(function (v) {
          v = v / 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2];
      }
      function ratio(a, b) {
        var l1 = lum(a), l2 = lum(b);
        var hi = Math.max(l1, l2), lo = Math.min(l1, l2);
        return (hi + 0.05) / (lo + 0.05);
      }
      var body = document.body;
      var cs = getComputedStyle(body);
      var ann = getComputedStyle(document.getElementById('announce'));
      var btn = getComputedStyle(document.querySelector('#actions button'));
      var base = getComputedStyle(document.documentElement).fontSize;
      return {
        body: ratio(cs.color, cs.backgroundColor),
        announce: ratio(ann.color, getComputedStyle(document.querySelector('.now')).backgroundColor),
        button: ratio(btn.color, btn.backgroundColor),
        fontPx: parseFloat(base)
      };
    })()
  `);
  check('контраст основного текста не ниже 7:1', metrics.body >= 7, metrics.body?.toFixed(2));
  check('контраст сообщения не ниже 4.5:1', metrics.announce >= 4.5, metrics.announce?.toFixed(2));
  check('контраст кнопок не ниже 4.5:1', metrics.button >= 4.5, metrics.button?.toFixed(2));
  check('базовый размер текста не меньше 18px', metrics.fontPx >= 18, metrics.fontPx + 'px');

  /* --- 10. Ничего не сломано в консоли --- */
  check('в консоли нет ошибок', consoleErrors.length === 0, consoleErrors.join(' | ').slice(0, 300));

  /* --- 11. Порядок обхода: всё достижимо с клавиатуры --- */
  const unreachable = await evalJS(`
    (function () {
      var bad = [];
      document.querySelectorAll('button, input, a[href]').forEach(function (el) {
        if (el.disabled) return;
        if (el.tabIndex < 0 && !el.hasAttribute('tabindex')) bad.push(el.textContent.trim().slice(0, 30) || el.id);
        if (el.getAttribute('aria-hidden') === 'true') bad.push('aria-hidden: ' + (el.textContent.trim().slice(0, 30) || el.id));
      });
      return bad;
    })()
  `);
  check('все элементы управления достижимы с клавиатуры', unreachable.length === 0, unreachable.join(', '));

  const failed = results.filter((r) => !r.ok).length;
  console.log('');
  console.log(failed === 0 ? 'Доступность: все ' + results.length + ' проверок пройдены.' : 'Провалено: ' + failed + ' из ' + results.length);
  return failed;
}

main()
  .then((failed) => {
    cleanup();
    process.exit(failed === 0 ? 0 : 1);
  })
  .catch((err) => {
    console.error('Ошибка проверки:', err.message);
    cleanup();
    process.exit(2);
  });
