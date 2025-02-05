require('dotenv').config();
const axios = require('axios');

const heroes = require('../models/hero')

async function getUserProfile(input) {
  try {
    var profile = await getSteamProfile(input);

    const response = await axios.get(
      `${process.env.GEMTD_HOST}/202203/heros/get/@${profile.steamid}?ver=${process.env.GEMTD_VER}&compen_shell=2&pcount=1&award=true`
    );

    const data = response.data.data[`${profile.steamid}`];
    const heroList = [];
      for (const [key,value] of Object.entries(data['hero_sea'])) {
        heroList.push(await heroes.fromData(key, value))
      }

    return {
      success: true,
      currentHero: await heroes.fromData(data['onduty_hero']['hero_id'], data['onduty_hero']),
      heroList: heroList,
      playerInformation: {
        name: profile.personaname,
        avatar: profile.avatarfull,
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
    console.log(error)
    return {
      success: false
    }
  }
}

async function setHero(input, heroId) {
  try {
    const profile = await getSteamProfile(input);
    await axios.get(
      `${process.env.GEMTD_HOST}/hero/save/${heroId}@${profile.steamid}?hehe=1`);

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

async function getSteamProfile(input) {
  var profile;
    if (input.length >= 17) {
      const steamResponse = await axios.get(
        `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_WEB_API_KEY}&steamids=${input}`
      )

      if (steamResponse.data.response.players.length < 1) {
        return {
          success: false,
          status: 404
        }
      }

      profile = steamResponse.data.response.players[0];
    } else {
      const openDotaResponse = await axios.get(
        `https://api.opendota.com/api/players/${input}`
      )

      if (openDotaResponse.status != 200) {
        return {
          success: false,
          status: 404
        }
      }

      profile = openDotaResponse.data.profile;
    }

    console.log(profile);

    return profile;
}

module.exports = {
  getUserProfile,
  setHero
}