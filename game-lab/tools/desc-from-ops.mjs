/* Описание способности, собранное из её операций: чтобы в тексте всегда были числа. */

const NUM = (n) => String(n);

function whoText(who) {
  if (who === 'others') return 'всем остальным';
  if (who === 'neighbors') return 'обоим соседям';
  if (who === 'self') return 'себе';
  return 'выбранной цели';
}

function plural(n, one, few, many) {
  const a = Math.abs(n) % 100;
  const b = Math.abs(n) % 10;
  if (a > 10 && a < 20) return many;
  if (b === 1) return one;
  if (b >= 2 && b <= 4) return few;
  return many;
}

const ONE = (n) => plural(n, 'единица', 'единицы', 'единиц');
const ACC = (n) => (n === 1 ? 'одну единицу' : NUM(n) + ' ' + ONE(n));
const DAT = (n) => (n === 1 ? 'одной единицы' : NUM(n) + ' ' + ONE(n));
const ART = (n) => plural(n, 'артефакт', 'артефакта', 'артефактов');
const ABIL = (n) => plural(n, 'способность', 'способности', 'способностей');

function opText(op) {
  const w = op.who || 'self';
  const n = op.n;
  switch (op.t) {
    case 'dmg':
      if (w === 'others') return `наносит по ${NUM(n)} урона всем остальным`;
      if (w === 'neighbors') return `наносит по ${NUM(n)} урона обоим соседям`;
      if (w === 'self') return `при этом получает ${n === 1 ? 'один урон' : NUM(n) + ' урона'}`;
      return `наносит ${n === 1 ? 'один урон' : NUM(n) + ' урона'} выбранной цели`;
    case 'dmgMissing':
      return `наносит ${NUM(op.base)} урона цели плюс ${NUM(1)} за каждые ${NUM(op.per)} недостающие единицы здоровья`;
    case 'dmgMissingMental':
      return `наносит урон, равный недостающей менталке плюс ${NUM(op.bonus)}, но не больше ${NUM(op.max)}`;
    case 'dmgDiff':
      return `наносит урон, равный разнице в здоровье, не больше ${NUM(op.max)}`;
    case 'dmgIfArtifacts':
      return `наносит ${NUM(n)} урона, если у цели ${NUM(op.need)} артефакта и больше`;
    case 'shieldBreaker':
      return `пробивает щит на ${NUM(op.through)}, срезает ${NUM(op.toShield)} щита, а без щита наносит ${NUM(op.plain)} урона`;
    case 'heal':
      if (w === 'others') return `восстанавливает по ${NUM(n)} здоровья всем остальным`;
      if (w === 'self') {
        if (op.lowHp !== undefined) return `восстанавливает ${NUM(n)} ${ONE(n)} здоровья, а при ${NUM(op.lowHp)} и меньше — ${NUM(op.lowN)} ${ONE(op.lowN)}`;
        return `восстанавливает ${ACC(n)} здоровья`;
      }
      return `восстанавливает ${ACC(n)} здоровья выбранному игроку`;
    case 'drainHp':
      return `забирает ${ACC(n)} здоровья у цели и восстанавливает столько же себе`;
    case 'shield':
      if (op.lessIfFewArtifacts !== undefined) {
        const need = op.richAt || 1;
        return `даёт ${NUM(n)} щита, если в руке ${NUM(need)} ${ART(need)} или больше, иначе ${NUM(op.lessIfFewArtifacts)}`;
      }
      if (op.lessIfNoArtifact !== undefined) {
        return `даёт ${NUM(n)} щита, если в руке есть артефакт, иначе ${NUM(op.lessIfNoArtifact)}`;
      }
      return `даёт ${NUM(n)} щита до разрушения`;
    case 'shieldDown':
      return `снимает у цели ${NUM(n)} щита`;
    case 'energy':
      if (n >= 0) return `даёт ${ACC(n)} энергии`;
      return `отнимает ${ACC(-n)} энергии`;
    case 'mental':
      if (n === -99) return 'обнуляет менталку цели';
      if (n >= 0) return `даёт ${ACC(n)} менталки`;
      return `отнимает ${ACC(-n)} менталки`;
    case 'skip':
      return 'цель пропускает свой следующий ход';
    case 'dot':
      return `вешает ${NUM(n)} отложенного урона до конца хода цели`;
    case 'noAttack':
      return 'цель не может атаковать';
    case 'noAbilities':
      return 'цель не может применять способности';
    case 'noArtifacts':
      return 'цель не может применять артефакты';
    case 'stealArtifact':
      return `крадёт ${NUM(n || 1)} ${ART(n || 1)}`;
    case 'stealAbility':
      return `крадёт ${NUM(n || 1)} ${ABIL(n || 1)}`;
    case 'discardAbility':
      return `цель сбрасывает ${NUM(n || 1)} ${ABIL(n || 1)}`;
    case 'discardArtifact':
      return w === 'self' ? `сбрасывает ${NUM(n || 1)} ${ART(n || 1)}` : `цель сбрасывает ${NUM(n || 1)} ${ART(n || 1)}`;
    case 'discardHalfArtifacts':
      return 'цель сбрасывает половину артефактов с округлением вверх';
    case 'discardAllArtifacts':
      return 'цель сбрасывает все артефакты';
    case 'discardOrDamage':
      return `цель сбрасывает способность и артефакт, а если их нет — получает ${NUM(n)} урона`;
    case 'drawArtifact':
      return `берёт ${NUM(n)} ${ART(n)} из колоды`;
    case 'drawAbility':
      return `берёт ${NUM(n)} ${ABIL(n)} из своего пула`;
    case 'returnAbility':
      return `возвращает ${NUM(n)} ${ABIL(n)} из сброса в руку`;
    case 'extraAction':
      return `даёт ${NUM(op.n || 1)} дополнительное действие`;
    case 'buff':
      return `прибавляет ${ACC(n)} к урону следующей атаки`;
    case 'weaken':
      return `цель бьёт слабее на ${ACC(n)}`;
    case 'dmgReduce':
      return `снижает получаемый урон на ${ACC(n)} на ${NUM(op.turns || 1)} хода, но не ниже одной единицы`;
    case 'taunt':
      return `цель обязана ударить вас и получает ${NUM(n)} урона`;
    case 'puppet':
      return `выбранный игрок бьёт другого на ${NUM(op.bonus || 0)} больше`;
    case 'forceAttack':
    case 'attackNeighbor':
      return 'цель обязана атаковать соседа';
    case 'purge':
      return 'снимает негативные эффекты и пропуски';
    case 'negate':
      return 'отменяет входящий урон';
    case 'mark':
      return `метка: ударивший цель восстанавливает ${NUM(op.heal)} здоровья`;
    case 'tax':
      return 'цель платит на единицу больше за карты';
    case 'forbidBig':
      return `запрещает способности от ${NUM(op.abilityMin)} энергии и артефакты от ${NUM(op.artifactMin)} менталки`;
    case 'forbidExpensive':
      return `запрещает карты от ${NUM(n)} и дороже`;
    case 'blockNext':
      return 'блокирует следующий удар целиком';
    case 'look':
      return 'показывает руку цели';
    case 'lookDeck':
      return 'смотрит верхние карты колоды';
    case 'giveArtifact':
      return 'отдаёт свой артефакт';
    case 'gainMaxHp':
      return `повышает здоровье и его максимум на ${ACC(n)}`;
    default:
      return '';
  }
}

export function describe(ability) {
  const defs = ability.modes ? ability.modes : [ability];
  if (ability.reaction) {
    const base = String(ability.desc || '').replace(/^\s*реакция\s*:\s*/i, '');
    return 'реакция: ' + base;
  }
  if (ability.modes) {
    const parts = defs.map((m) => (m.ops || []).map(opText).filter(Boolean).join(', '));
    return 'на выбор: ' + parts.join('; либо ');
  }
  const body = (ability.ops || []).map(opText).filter(Boolean).join(', ');
  return body || ability.desc || '';
}
