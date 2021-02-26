const KeyGenerator = require('uuid-key-generator');
const User = require("../model/user");
const Sensor = require("../model/sensor");
const Authentication = require("../utils/authentication");
const Messenger = require("../utils/messenger");

exports.login = (req, res, next) => {
    var email = req.body.email 
    if(email) {
        var password = req.body.password 
        if (password) {
            return User.findOne({ where: { email: email}}).then( user => {
                if(user) {
                    if(user.passwordHash == password) {
                        res.status(200).json({"message": "Authorization Succeded",
                                              "token": Authentication.authentication.getTokenFor(email, password),
                                              "authMethod": "Basic"});

                    } else {
                        res.status(403).json({"message": "Bad credientials"});
                    }
                } else {
                   res.status(403).json({"message": "Bad credientials"});
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
    var name = req.body.name
    if(name == null) {
        name = "noname"
    } 

    if(email) {
       if(validateEmail(email)) {
            var password = req.body.password 
            if (password) {
               if(password.length > 3 ) {
                return User.findOne({ where: { email: email }}).then( user => {
                    if(user) {
                        res.status(409).json({"message": "Email is already taken "});
                    } else {
                        return User.create({email: email,
                        name: name,
                        passwordHash: password,
                        active: false,
                        isAdmin: Authentication.authentication.shouldBeAdmin(email)}).then(
                            user => {
                                if(user) {
                                    addAllSensorsTo(user);
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
    var email = req.body.email 
    var emailTitle = "Whiff - password reset query"
    var keygen = new KeyGenerator()
    return User.findOne({ where: { email: email}}).then( user => {
        if(user) {
            user.resetPasswordKey = keygen.generateKey();
            var adress = "https://whiffdev.herokuapp.com/resetPasswordForm?secret=" + user.resetPasswordKey; 
            var emailText = "Hello, \n \n Likely, you requested reset email. \n Link: " + adress + "\n If you didn't requested, ignore this email. \n Regards, \n Whiff Team \n \n Please do not reply this email. "
            return user.save().then( user => { 
                Messenger.messenger.sendEmail(email, emailTitle, emailText).then( result => {   
                    if(result.accepted.length > 0) {
                        res.status(200).json({"message": "request succeeded"});
                    } else {
                        res.status(500).json({ "message": "send email failed"});
                    }
                })
            })
        } else {
            res.status(200).json({"message": "request succeeded"});
        }
    })
}

exports.deleteUser = (req, res, next) => {
    if(req.user.isAdmin) {
        let userId = req.query.userId 
        if(userId) {
            return User.findOne({ where: { id: userId }}).then( user => {
                if(user) {
                    return user.destroy().then( result => {
                        res.status(202).json({"message": "removed object"});
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
               // delete user['passwordHash']
            })
            res.status(200).json({"user":users});
        });
    } else {
        res.status(403).json({"message": "No rights to this operation."});
    }
}

exports.saveNewPassword = (req, res, next) => {
if(req.body.secret) {
        return User.findOne({ where: { resetPasswordKey: req.body.secret }}).then( user => {
            if(user) {
                if(req.body.password == req.body.repeatPassword) {
                    if(req.body.password.length > 3 ) {
                        user.passwordHash = req.body.password
                        user.resetPasswordKey = null
                        return user.save().then( user => {
                            if(user) {
                                res.status(202).json("success");
                            } else {
                                res.status(500).json("failure");
                            }
                        })
                    } else {
                        res.status(400).json({"message": "Password must contain at least 3 characters."});
                    }
                } else {
                    res.status(400).json({"message": "Passwords don't match."});
                }
            } else { 
                res.status(403).json({"message": "Didn't find requested user"});
            }
        })
    } else {
        res.status(401).json({"message": "No rights to this operation"});
    }
}

function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

function addAllSensorsTo(user) { 
    Sensor.findAll().then( sensors => {
        if(sensors) {
            sensors.forEach( sensor => {
                user.addSensor(sensor);
            });
        };
    });
}
