require('dotenv').config();
const axios = require('axios');

const heroes = require('../models/hero')

async function getUserProfile(steamId) {
  try {
    const response = await axios.get(
      `${process.env.GEMTD_HOST}/202203/heros/get/@${steamId}?ver=${process.env.GEMTD_VER}&compen_shell=2&pcount=1&award=true`
    );

    const data = response.data.data[`${steamId}`];
    const heroList = [];
      for (const [key,value] of Object.entries(data['hero_sea'])) {
        heroList.push(await heroes.fromData(key, value))
      }

    return {
      success: true,
      currentHero: await heroes.fromData(data['onduty_hero']['hero_id'], data['onduty_hero']),
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
  } catch (error) {
    return {
      success: false
    }
  }
}

async function setHero(steamId, heroId) {
  try {
    const response = await axios.get(
      `${process.env.GEMTD_HOST}/hero/save/${heroId}@${steamId}?hehe=1`);

    return {
      success: true
    }
  } catch (error) {
    console.log(error)
    return {
      success: false
    };
  }
}

module.exports = {
  getUserProfile,
  setHero
}