const KeyGenerator = require('uuid-key-generator');
const User = require("../model/user");
const Sensor = require("../model/sensor");
const Authentication = require("../utils/authentication");
const Messenger = require("../utils/messenger");
const bcrypt = require('bcryptjs');
 
exports.login = (req, res, next) => {
    var email = req.body.email 
    if(email) {
        var password = req.body.password
        if (password) {  
            return User.findOne({ where: { email: email}}).then( user => {
                if(user) {
                    bcrypt.hash(password, 12).then (hashedPassword => {
                        if(hashedPassword) {
                            if(user.passwordHash == password) {
                                res.status(200).json({"message": "Authorization Succeded",
                                                      "token": Authentication.authentication.getTokenFor(email, password),
                                                      "authMethod": "Basic"});
        
                            } else {
                                return bcrypt.compare(password, user.passwordHash).then( result => {
                                    if(result == true) {
                                        res.status(200).json({"message": "Authorization Succeded",
                                        "token": Authentication.authentication.getTokenFor(email, password),
                                        "authMethod": "Basic"});
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
                        return bcrypt.hash(password, 12).then (hashedPassword => {
                            if(hashedPassword != null) {
                        return User.create({email: email,
                        name: name,
                        passwordHash: hashedPassword,
                        active: false,
                        isAdmin: Authentication.authentication.shouldBeAdmin(email)}).then(
                            user => {
                                if(user) {
                                    res.status(201).json({"message": "Account created",
                                                            "token": Authentication.authentication.getTokenFor(email, password)});
                                                            
                            } else {
                                    res.status(500).json({"message": "Database error"});
                                }
                            }
                        )
                            } else {
                                res.status(500).json({"message": "Database error"});

                            }

                    }) 
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
            var adress = "https://whiffapp.herokuapp.com/resetPasswordForm?secret=" + user.resetPasswordKey; 
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
                        bcrypt(req.body.password,12).then(hashedPassword=>{
                            if(hashedPassword) {
                                user.passwordHash = hashedPassword
                                user.resetPasswordKey = null
                                return user.save().then( user => {
                                    if(user) {
                                        res.status(202).json("success");
                                    } else {
                                        res.status(500).json("failure");
                                    }
                                })
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

exports.changePassword = (req, res, next) => {
    let userId = req.user.id 
    let password = req.body.password
    if(userId) {
        if(password) {
        return User.findOne({ where: { id: userId }}).then( user => {
            if(user) {
                if(password.length > 3 ) {
                    bcrypt.hash(password, 12).then (hashedPassword => {
                        if(hashedPassword) {
                            user.passwordHash = hashedPassword
                            return user.save().then( user => {
                                if(user) {
                                     res.status(200).json({"message": "Password Changed",
                                                             "token": Authentication.authentication.getTokenFor(user.email, req.body.password)});
                                } else {
                                    res.status(500).json("failure");
                                }
                            })
                        } else {
                            res.status(500).json("failure");
                        }
                    })
              
                } else {
                    res.status(400).json({"message": "Password too short."});
                }
            } else {
                res.status(400).json({"message": "Didn't find requested user."});
            }
        })
        } else {
            res.status(400).json({"message": "You didn't set password parameter in body."});
        }
    } else {
        res.status(400).json({"message": "You didn't set userId parameter in body."});
    }
}


exports.requestDemo = (req, res, next) => {  
    let userId = req.user.id 
    if(userId) {
        return User.findOne({ where: { id: userId }}).then( user => {
            if(user) {
                addDemoSensorsTo(user);
                res.status(201).json({"message": "demo sensors added"});
            } else {
                res.status(400).json({"message": "Didn't find requested user."});
            }
        })
    } else {
        res.status(400).json({"message": "You didn't set userId parameter in body."});
    }

}

exports.addSensor = (req, res, next) => {  
    let userId = req.user.id 
    let sensorId = req.body.sensorId 
    let key = req.body.sensorKey
    if(key) {
        if(sensorId) {
            if(userId) {
                return User.findOne({ where: { id: userId }}).then( user => {
                    if(user) {
                        return Sensor.findOne({where: { externalIdentifier: sensorId}}).then( sensor => {
                            if(sensor) {
                                if(sensor.key == key) {
                                    user.addSensor(sensor);
                                    if(sensor.isInsideBuilding == false) {
                                        user.mainSensorId = sensor.externalIdentifier;
                                    }
                                    user.save();
                                    res.status(201).json({"message": "sensor added"});
                                } else {
                                    res.status(400).json({"message": "Invalid sensor key"});

                                }
                            } else {
                                res.status(400).json({"message": "Didn't find requested sensor."});
                            }
                        });
                    } else {
                        res.status(400).json({"message": "Didn't find requested user."});
                    }
                });
            } else {
                res.status(400).json({"message": "You didn't set userId parameter in body."});
            }
        } else {
            res.status(400).json({"message": "You didn't set sensorId."});
        }
    } else {
        res.status(400).json({"message": "You didn't set sensorKey."});

    }
}

exports.deleteSensor = (req, res, next) => {  
    let userId = req.user.id 
    let sensorId = req.body.sensorId 
    if(sensorId) {
        if(userId) {
            return User.findOne({ where: { id: userId }}).then( user => {
                if(user) {
                    return user.getSensors({ where:  { externalIdentifier: sensorId }}).then( sensors => {
                            if(sensors[0]) {
                                return user.removeSensor(sensors[0]).then( result => {
                                    if(user.mainSensorId == sensors[0].externalIdentifier) {
                                        user.mainSensorId = null
                                        user.save().then( savedUser => {
                                            res.status(201).json({"message": "Sensor deleted"});
                                        });
                                    } else {
                                        res.status(201).json({"message": "Sensor deleted"});
                                    }
                                })
                            } else {
                                res.status(400).json({"message": "Didn't find sensor with requested id."});
                            }
                    });
                } else {
                    res.status(400).json({"message": "Didn't find requested user."});
                }
            });
        } else {
            res.status(400).json({"message": "You didn't set userId parameter in body."});
        }
    } else {
        res.status(400).json({"message": "You didn't set sensorId."});
    }

}

function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

function addDemoSensorsTo(user) { 
    Sensor.findOne({where: { externalIdentifier: 97}}).then( sensor => {
        if(sensor) {
            user.addSensor(sensor);
            user.save();
            Sensor.findOne({where: { externalIdentifier: 95}}).then( sensor => {
                if(sensor) {
                    user.mainSensorId = sensor.externalIdentifier;
                    user.addSensor(sensor);
                    user.save();
                }
            });
        } 
    });
}
