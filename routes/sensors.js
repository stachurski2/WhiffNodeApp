const express = require('express');
const router = express.Router();

router.get('/sensors', (req, res, next) => {
    let userId = req.query.userId 
    if(userId) {
        res.status(200).json({"message": "You have asked about sensor for user with id: " + userId});
    } else {
        res.status(200).json({"message": "You didn't set userId parameter in body."});
    }
    }
);

exports.routes = router
