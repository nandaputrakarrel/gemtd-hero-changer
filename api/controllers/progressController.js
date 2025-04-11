const service = require('../services/progressService');

async function calculate(req, res, next) {
  const result = await service.calculate(
    parseInt(req.query.currentWave), 
    parseInt(req.query.currentProgress), 
    parseInt(req.query.currentMobCount), 
    parseInt(req.query.currentKill));
  if (result.success) {
    res.status(200).send({
      data: result.data,
    });
  } else {
    res.status(result.status).send(result);
  }
}

module.exports = {
  calculate
}