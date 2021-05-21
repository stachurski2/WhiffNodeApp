
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/registerUser', userController.registerUser);

router.post('/loginUser', userController.login);

router.get('/userList', userController.userList);

router.post('/resetPassword', userController.remindPassword);

router.delete('/deleteUser', userController.deleteUser);

router.post('/saveNewPassword', userController.saveNewPassword)

router.post('/changePassword', userController.changePassword)

router.post('/requestDemo', userController.requestDemo);

router.post('/requestAddSensor', userController.addSensor);

router.post('/requestDeleteSensor', userController.deleteSensor);

exports.routes = router