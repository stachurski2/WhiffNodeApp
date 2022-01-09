const User = require("../model/user");
const bcrypt = require('bcryptjs');

exports.loginForm = (req, res, next) => {
    res.status(200).render('loginForm');    
};

exports.loginRequest = (req, res, next) => {
    console.log(req.body.password);
    console.log(req.body.login);

    var login = req.body.login;
    var password = req.body.password;
 
    if(login) {
        if (password) {  
            return User.findOne({ where: { email: login}}).then( user => {
                if(user) {
                    bcrypt.hash(password, 12).then (hashedPassword => {
                        if(hashedPassword) {
                            if(user.passwordHash == password) {
                                res.status(200).json({"message": "Authorization Succeded",
                                                      "token": Authentication.authentication.getTokenFor(login, password),
                                                      "authMethod": "Basic"});
        
                            } else {
                                return bcrypt.compare(password, user.passwordHash).then( result => {
                                    if(result == true) {
                                        res.status(200).json({"message": "success you are logged in!"});
                                    } else {
                                        res.status(401).json({"message": "Bad credientials"});
                                    }
                                })
                            }
                        } else {
                            res.status(500).json({"message": "Internal error"})
                        }})
                } else {
                   res.status(403).json({"message": "Bad credientials"});
                }
            })
        } else {
            res.status(403).json({"message": "Bad credientials"});
        }
    } else {
        res.status(403).json({"message": "Bad credientials"});
    }
};