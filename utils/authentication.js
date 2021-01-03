const Sequelize = require('sequelize');

class Authentication {

    static getTokenFor(email, password) {
        return Buffer.from(`${email}:${password}`).toString("base64");
    }

    static authorize(req, res, next) {
        const User = require('../model/user');
        if(req.path == "/registerUser" || req.path == "/loginUser" || req.path == "/resetPassword" || req.path == "/resetPasswordForm" ||  req.path == "/saveNewPassword" || req.path == "/favicon.ico") {
            next();
            return;
        } else {
            if (!req.headers.authorization || req.headers.authorization.indexOf('Basic ') === -1) {
                res.status(401).json({ message: 'Missing Authorization Header' });
            }
            const base64Credentials = req.headers.authorization.split(' ')[1];
            const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
            const [username, password] = credentials.split(':');
            return User.findOne({ where: { email: username }}).then( user => {
                if(user.passwordHash == password) {
                    req.user = user
                    next();
                } else {
                    res.status(401).json({"message": "Bad credientials"});
                }
            })
        }
    } 

    static shouldBeAdmin(email) {
        if(email == "stanislawsobczyk@icloud.com") {
            return true; 
        }
        return false;
    }
}


exports.authentication = Authentication;

