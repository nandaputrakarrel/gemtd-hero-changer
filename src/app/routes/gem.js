const express = require('express');
const router = express.Router();
const {handlerException} = require('../exceptions/handler');
const controller = require('../controllers/gemController');

router.get('/gem/:steamId',
    handlerException(controller.getUserProfile));

router.post('/gem/set',
    handlerException(controller.setHero));

module.exports = router;