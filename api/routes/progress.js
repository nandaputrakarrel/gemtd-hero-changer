const express = require('express');
const router = express.Router();
const {handlerException} = require('../exceptions/handler');
const controller = require('../controllers/progressController');

router.get('/api/progress/calculate',
    handlerException(controller.calculate));

module.exports = router;