const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController');

router.get('/sensorList', sensorController.getSensorListForUser);

router.get('/sensorData', sensorController.getDataFromSensor);

exports.routes = router
