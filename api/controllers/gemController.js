const service = require('../services/gemService');

async function getUserProfile(req, res, next) {
  const result = await service.getUserProfile(req.params.steamId);
  if (result.success) {
    res.status(200).send({
      data: result,
    });
  } else if (result.status == 404) {
    res.status(404).send();
  } else {
    res.status(500).send();
  }
}

async function setHero(req, res, next) {
  const body = req.body;
  if (body.steamId && body.heroId) {
    const result = await service.setHero(body.steamId, body.heroId);
    if (result.success) {
      res.status(200).send({
        steamId: body.steamId,
        heroId: body.heroId
      });
    } else {
      res.status(500).send();
    }
    
  } else {
    res.status(400).send({
      status: 400,
      error: 'Steam ID or Hero ID is missing.'
    })
  }
}

module.exports = {
  getUserProfile,
  setHero
}