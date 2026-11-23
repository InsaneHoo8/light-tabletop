/* Числа словами по-русски. Применяется при сборке docx, чтобы все документы
   писались одинаково: цифрами не пишем. */

const UNITS = ['ноль', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять',
  'десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать',
  'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];

const TENS = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
const HUNDREDS = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];

const GEN = ['нуля', 'одного', 'двух', 'трёх', 'четырёх', 'пяти', 'шести', 'семи', 'восьми', 'девяти',
  'десяти', 'одиннадцати', 'двенадцати', 'тринадцати', 'четырнадцати', 'пятнадцати',
  'шестнадцати', 'семнадцати', 'восемнадцати', 'девятнадцати'];

function under100(n, gender) {
  if (n < 20) {
    if (n === 1) return gender === 'f' ? 'одна' : gender === 'n' ? 'одно' : 'один';
    if (n === 2) return gender === 'f' ? 'две' : 'два';
    return UNITS[n];
  }
  const t = Math.floor(n / 10);
  const u = n % 10;
  if (u === 0) return TENS[t];
  let unit = UNITS[u];
  if (u === 1) unit = gender === 'f' ? 'одна' : gender === 'n' ? 'одно' : 'один';
  if (u === 2) unit = gender === 'f' ? 'две' : 'два';
  return TENS[t] + ' ' + unit;
}

export function toWords(n, gender = 'm') {
  n = Math.abs(Math.floor(n));
  if (n === 0) return 'ноль';
  const parts = [];
  const thousands = Math.floor(n / 1000);
  const rest = n % 1000;
  if (thousands > 0) {
    const tMod100 = thousands % 100;
    const tMod10 = thousands % 10;
    const tFem = tMod10 >= 1 && tMod10 <= 4 && !(tMod100 >= 11 && tMod100 <= 14);
    const tGender = tFem ? 'f' : 'm';
    parts.push(toWords(thousands, tGender));
    let word = 'тысяч';
    if (tMod100 >= 11 && tMod100 <= 14) word = 'тысяч';
    else if (tMod10 === 1) word = 'тысяча';
    else if (tMod10 >= 2 && tMod10 <= 4) word = 'тысячи';
    parts.push(word);
  }
  if (rest > 0 || thousands === 0) {
    const h = Math.floor(rest / 100);
    const tail = rest % 100;
    if (h > 0) parts.push(HUNDREDS[h]);
    if (tail > 0) parts.push(under100(tail, gender));
  }
  return parts.join(' ').trim();
}

export function toGenitive(n) {
  n = Math.abs(Math.floor(n));
  if (n === 0) return 'нуля';
  if (n < 20) return GEN[n];
  const tensHead = n >= 100 ? toWords(Math.floor(n / 10) * 10, 'm') : TENS[Math.floor(n / 10)];
  const u = n % 10;
  if (u === 0) return tensHead;
  return tensHead + ' ' + GEN[u];
}

function decimalWords(intPart, fracDigits) {
  const fracNum = Number(fracDigits);
  const mod100 = fracNum % 100;
  const mod10 = fracNum % 10;
  const singular = mod10 === 1 && mod100 !== 11;
  let denom;
  if (fracDigits.length === 1) denom = singular ? 'десятая' : 'десятых';
  else if (fracDigits.length === 2) denom = singular ? 'сотая' : 'сотых';
  else denom = singular ? 'тысячная' : 'тысячных';
  const whole = intPart % 10 === 1 && intPart % 100 !== 11 ? ' целая ' : ' целых ';
  return toWords(intPart, 'f') + whole + toWords(fracNum, 'f') + ' ' + denom;
}

const FEMININE_NEXT = /^(энерг|менталк|единиц|способност|карт|атак|цели|цель|раны|единицы)/i;

function genderFor(after) {
  const w = (after || '').trim().toLowerCase().replace(/^[^а-яё]+/, '');
  if (!w) return 'm';
  if (FEMININE_NEXT.test(w)) return 'f';
  if (/^(здоров|щит)/.test(w)) return 'n';
  return 'm';
}

const PROTECT = ['Земля 404', 'Арк’Риона', '№∞', '05.11.2026', '06.11.2026', '07.11.2026', '08.11.2026'];

const PREP_GEN = /(?:^|[\s(])(от|до|из|более|менее|свыше|около|после|без)\s*$/i;

function tokenFor(i) {
  return '\u0001' + String.fromCharCode(65 + (i % 26)) + String.fromCharCode(65 + Math.floor(i / 26)) + '\u0001';
}

export function numbersToWords(text) {
  let out = text;

  const saved = [];
  for (const p of PROTECT) {
    const tok = tokenFor(saved.length);
    saved.push(p);
    out = out.split(p).join(tok);
  }

  // «от 1–4» — не удваиваем предлог
  out = out.replace(/(?:от\s*)?(\d+)\s*[–—-]\s*(\d+)/gi, (m, a, b) => {
    const startsWithOt = /^от/i.test(m.trim());
    return (startsWithOt ? 'от ' : 'от ') + toGenitive(Number(a)) + ' до ' + toGenitive(Number(b));
  });

  out = out.replace(/(\d+),(\d+)\s*%/g, (m, a, b) => decimalWords(Number(a), b) + ' процента');
  out = out.replace(/(\d+)\s*%/g, (m, a) => toWords(Number(a), 'm') + ' процентов');
  out = out.replace(/(\d+),(\d+)/g, (m, a, b) => decimalWords(Number(a), b));

  out = out.replace(/([−–]|\+)\s*(\d+)/g, (m, sign, a) => {
    return (sign === '+' ? 'плюс ' : 'минус ') + toWords(Number(a), 'm');
  });

  out = out.replace(/\d+/g, (m, offset, whole) => {
    const before = whole.slice(Math.max(0, offset - 8), offset);
    const after = whole.slice(offset + m.length, offset + m.length + 14);
    if (PREP_GEN.test(before)) return toGenitive(Number(m));
    return toWords(Number(m), genderFor(after));
  });

  for (let i = 0; i < saved.length; i++) {
    out = out.split(tokenFor(i)).join(saved[i]);
  }
  return out;
}
