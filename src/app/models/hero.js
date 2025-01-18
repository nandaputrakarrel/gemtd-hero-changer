const heroes = require('../enums/heroes');
const effects = require('../enums/effects');

const ability = require('./ability')

async function fromData(id, data) {
  const heroAbilities = [];
  for (const [key,value] of Object.entries(data.ability)) {
    heroAbilities.push(await ability.translate(key, value))
  }

  return {
    hero: heroes[id],
    effect: data.effect ? effects[data.effect] : null,
    abilities: heroAbilities,
    heroImage: `https://cdn.akamai.steamstatic.com/apps/dota2/images/dota_react/heroes/${heroes[id].toLowerCase().replace(/\s/g, '')}.png`
  }
}

module.exports = {
  fromData
}