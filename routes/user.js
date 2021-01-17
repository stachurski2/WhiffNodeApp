
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/registerUser', userController.registerUser);

router.post('/loginUser', userController.login);

router.get('/userList', userController.userList);

router.post('/resetPassword', userController.remindPassword);

router.delete('/deleteUser', userController.deleteUser);

router.post('/saveNewPassword', userController.saveNewPassword)

exports.routes = router