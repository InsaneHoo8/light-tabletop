/* Проверка разметки без браузера: то, что можно проверить статически.
   Полноценная проверка дерева доступности — в ax-audit.mjs.
   Запуск: node game-lab/tools/markup-check.mjs */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(here, '..', 'demo', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(here, '..', 'demo', 'demo.css'), 'utf8');
const js = fs.readFileSync(path.join(here, '..', 'demo', 'demo.js'), 'utf8');

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok: !!ok });
  console.log((ok ? 'OK   ' : 'FAIL ') + name + (!ok && detail ? ' -> ' + detail : ''));
};

check('указан язык документа', /<html[^>]+lang="ru"/.test(html));
check('объявлена кодировка', /<meta[^>]+charset="utf-8"/i.test(html));
check('есть заголовок первого уровня', /<h1[^>]*>/.test(html));
check('нет пустых ссылок-заглушек', !/href="#"/.test(html));

const live = html.match(/<[^>]+aria-live="polite"[^>]*>/g) || [];
check('ровно одна вежливая живая область', live.length === 1, 'найдено ' + live.length);
check('живая область неделима (aria-atomic)', /aria-live="polite"[^>]*aria-atomic="true"|aria-atomic="true"[^>]*aria-live="polite"/.test(html));
check('у живой области есть роль status', /role="status"/.test(html));

// Журнал не должен быть живой областью: role=log по умолчанию болтлив.
check('журнал не объявлен болтливой областью', !/role="log"/.test(html) && !/<ol[^>]+aria-live/.test(html));

check('у таблицы есть подпись', /<table[^>]*>[\s\S]*?<caption>/.test(html));
check('у ячеек-заголовков указан scope', (html.match(/<th scope="/g) || []).length >= 7);
check('у всех inputs есть label', (html.match(/<input /g) || []).length === (html.match(/<label>/g) || []).length);

check('есть раздел помощи с заголовком, доступным фокусу', /id="help-h"[^>]*tabindex="-1"/.test(html));
check('есть noscript на случай отключённого JS', /<noscript>/.test(html));

// CSS-гигиена, важная для слабовидящих.
check('есть видимый фокус', /:focus-visible/.test(css));
check('учтён тёмный режим системы', /prefers-color-scheme:\s*dark/.test(css));
check('учтён режим высокой контрастности', /forced-colors:\s*active/.test(css));
check('учтено отключение анимаций', /prefers-reduced-motion:\s*reduce/.test(css));
check('текст не мельче 18px по умолчанию', /html\s*\{[\s\S]*?font-size:\s*(\d+)px/.test(css) && Number(RegExp.$1) >= 18);
check('нет запрета масштабирования', !/user-scalable\s*=\s*no|maximum-scale\s*=\s*1/.test(html));

// Клавиши привязаны к физическим кодам, а не к буквам: иначе русская раскладка ломает управление.
check('клавиши привязаны к e.code', /e\.code/.test(js));
check('нет привязки к e.key для букв', !/e\.key\s*===?\s*['"][a-zA-Z]['"]/.test(js));
check('есть отладочный доступ для проверок', /window\.__demo/.test(js));
check('сообщение повторяется через перезапись', /setTimeout\(function \(\) \{\s*el\.announce\.textContent = text/.test(js));

const failed = results.filter((r) => !r.ok).length;
console.log('');
console.log(failed === 0 ? 'Разметка: все ' + results.length + ' проверок пройдены.' : 'Провалено: ' + failed);
process.exit(failed === 0 ? 0 : 1);
