const abilities = require('../enums/abilities');

async function translate(id, level) {
  return {
    name: abilities[id],
    level: level
  }
}

module.exports = {
  translate
}