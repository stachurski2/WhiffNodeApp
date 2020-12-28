
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/registerUser', userController.registerUser);

router.get('/loginUser', userController.getLogin);

router.post('/resetPassword', userController.remindPassword);

router.delete('/deleteUser', userController.deleteUser);

exports.routes = router