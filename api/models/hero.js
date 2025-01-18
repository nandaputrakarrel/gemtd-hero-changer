const heroes = require('../enums/heroes');
const effects = require('../enums/effects');
const potrait = require('../enums/potrait');

const ability = require('./ability')

async function fromData(id, data) {
  const heroAbilities = [];
  for (const [key,value] of Object.entries(data.ability)) {
    heroAbilities.push(await ability.translate(key, value))
  }

  return {
    heroId: id,
    hero: heroes[id],
    effect: data.effect ? effects[data.effect] : null,
    abilities: heroAbilities,
    heroImage: potrait[id]
  }
}

module.exports = {
  fromData
}