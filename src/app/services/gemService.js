require('dotenv').config();
const axios = require('axios');

const heroes = require('../models/hero')

HEROES_LIST_KEYWORD = 'hero_sea';
CURRENT_HERO_KEYWORD = 'onduty_hero';

async function getUserProfile(steamId) {
  const response = await axios.get(
    `${process.env.GEMTD_HOST}/202203/heros/get/@${steamId}?ver=${process.env.GEMTD_VER}&compen_shell=2&pcount=1&award=true`
  );

  const data = response.data.data[`${steamId}`];
  const heroList = [];
    for (const [key,value] of Object.entries(data[HEROES_LIST_KEYWORD])) {
      heroList.push(await heroes.fromData(key, value))
    }

  return {
    currentHero: await heroes.fromData(data[CURRENT_HERO_KEYWORD]['hero_id'], data[CURRENT_HERO_KEYWORD]),
    heroList: heroList,
    playerInformation: {
      currency: {
        shell: data.shell,
        iceCube: data.ice,
        candy: data.candy
      },
      seasonRank: {
        match: data.rank_info.match,
        score: data.rank_info.score,
        allRank: data.rank_info.rankall,
        coopRank: data.rank_info.rankcoop,
        raceRank: data.rank_info.rankrace
      },
      seasonProgress: data.rank_info.best_kills
    }
  };
}

module.exports = {
  getUserProfile
}