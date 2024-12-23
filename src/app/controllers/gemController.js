const service = require('../services/gemService');

async function getUserProfile(req, res, next) {
  const result = await service.getUserProfile(req.params.steamId);
  res.status(200).send({
    status: 200,
    data: result,
  });
}

module.exports = {
  getUserProfile
}