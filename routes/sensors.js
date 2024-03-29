const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController');

router.get('/sensorList', sensorController.getSensorListForUser);

router.get('/allSensors', sensorController.getAllSensors);

router.get('/sensorData', sensorController.getDataFromSensor);

router.get('/lastPieceOfDataFromSensor', sensorController.getLastPieceOfDataFromSensor)

router.get('/currentStateData', sensorController.currentStateData)

router.post('/addSensor', sensorController.addSensor);

router.post('/addSensorToUser', sensorController.addSensorToUser);

router.post('/removeSensorFromUser', sensorController.removeSensorFromUser);

router.delete('/removeSensor', sensorController.removeSensor);

exports.routes = router
