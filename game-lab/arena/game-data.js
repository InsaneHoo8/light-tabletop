/* Совместимость: данные игры живут в cards.js, здесь только удобные обёртки. */

var C = require('./cards.js');

var CHARACTERS = C.CHARACTERS.map(function (c) {
  var copy = {};
  for (var k in c) copy[k] = c[k];
  copy.powerWord = 'энергия';
  copy.text = c.text;
  return copy;
});

var ARTIFACTS = C.ARTIFACTS.map(function (a) {
  var copy = {};
  for (var k in a) copy[k] = a[k];
  copy.trade = a.trade || a.cost;
  copy.target = !!a.target;
  return copy;
});

var POOL = [];
for (var i = 0; i < CHARACTERS.length; i++) {
  for (var j = 0; j < CHARACTERS[i].abilities.length; j++) {
    POOL.push(CHARACTERS[i].abilities[j]);
  }
}

function charById(id) {
  for (var i = 0; i < CHARACTERS.length; i++) if (CHARACTERS[i].id === id) return CHARACTERS[i];
  return null;
}

function artifactById(id) {
  for (var i = 0; i < ARTIFACTS.length; i++) if (ARTIFACTS[i].id === id) return ARTIFACTS[i];
  return null;
}

function abilityById(id) {
  for (var i = 0; i < POOL.length; i++) if (POOL[i].id === id) return POOL[i];
  return null;
}

module.exports = {
  WORLDS: C.WORLDS,
  CHARACTERS: CHARACTERS,
  ARTIFACTS: ARTIFACTS,
  POOL: POOL,
  charById: charById,
  artifactById: artifactById,
  abilityById: abilityById
};
