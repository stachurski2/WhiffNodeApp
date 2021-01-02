const User = require("../model/user");
const Authentication = require("../utils/authentication");

exports.getLogin = (req, res, next) => {
    var email = req.query.email 
    if(email) {
        var password = req.query.password 
        if (password) {
            return User.findOne({ where: { email: email}}).then( user => {
                if(user.passwordHash == password) {
                    res.status(200).json({"message": "Authorization Succeded",
                                         "token": Authentication.authentication.getTokenFor(email, password)});

                } else {
                    res.status(401).json({"message": "Bad credientials"});
                }
            })
        } else {
            res.status(400).json({"message": "You didn't set password"});
        }
    } else {
        res.status(400).json({"message": "You didn't set email"});
    }

};

exports.registerUser = (req, res, next) => {
    var email = req.body.email 
    if(email) {
       if(validateEmail(email)) {
            var password = req.body.password 
            if (password) {
               if(password.length > 3 ) {
                return User.findOne({ where: { email: email}}).then( user => {
                    if(user) {
                        res.status(409).json({"message": "Email is already taken "});
                    } else {
                        return User.create({email: email,
                        name: req.body.name,
                        passwordHash: password,
                        active: false,
                        isAdmin: Authentication.authentication.shouldBeAdmin(email)}).then(
                            product => {
                                if(product) {
                                    res.status(201).json({"message": "Account created",
                                                            "token": Authentication.authentication.getTokenFor(email, password)});
                                } else {
                                    res.status(500).json({"message": "Database error"});
                                }
                            }
                        )
                    }
                })
               } else {
                   res.status(400).json({"message": "Password must contain at least 3 characters"});
               }
            } else {
                res.status(400).json({"message": "You didn't set password"});
            }
       } else {
          res.status(400).json({"message": "email incorrect"});
       }
    } else {
        res.status(400).json({"message": "You didn't set email"});
    }
}

exports.remindPassword = (req, res, next) => {
    //send email
    res.status(200).json({"message": "request succeeded"});
}

exports.deleteUser = (req, res, next) => {
    if(req.user.isAdmin) {
        let userId = req.query.userId 
        if(userId) {
            return User.findOne({ where: { id: userId }}).then( user => {
                if(user) {
                    return user.destroy().then( result => {
                        res.status(202).json({"message": "removed  object"});
                    })
                } else {
                    res.status(422).json({"message": "Didn't find user you requested"});
                }
            })
        } else {
            res.status(400).json({"message": "Didn't set userId"});
        }
    } else {
        res.status(403).json({"message": "No rights to this operation."});
    }
}


exports.userList = (req, res, next) => {
    if(req.user.isAdmin) {
        return User.findAll({ raw : true, nest : true }).then( users => {
            users.forEach( user => {
                delete user['passwordHash']
            })
            res.status(200).json({"user":users});
        });
    } else {
        res.status(403).json({"message": "No rights to this operation."});
    }
}

function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}
