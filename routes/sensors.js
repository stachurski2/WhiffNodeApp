const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController');

router.get('/sensorList', sensorController.getSensorListForUser);

router.get('/sensorData', sensorController.getDataFromSensor);

router.post('/addSensor', sensorController.addSensor);

router.post('/addSensorToUser', sensorController.addSensorToUser);

router.post('/removeSensorFromUser', sensorController.removeSensorFromUser);

router.delete('/removeSensor', sensorController.removeSensor);

exports.routes = router
