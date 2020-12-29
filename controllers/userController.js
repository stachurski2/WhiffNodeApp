const User = require("../model/user");

exports.getLogin = (req, res, next) => {
    var email = req.query.email 
    if(email) {
        var password = req.query.password 
        if (password) {
            return User.findOne({ where: { email: email}}).then( user => {
                if(user.passwordHash == password) {
                    res.status(200).json({"message": "Authorization Succeded",
                                         "userId": user.id});
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
                        isAdmin: false }).then(
                            product => {
                                if(product) {
                                    res.status(201).json({"message": "Account created"});
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
    res.status(200).json({"message": "request succeeded"});
}

exports.deleteUser = (req, res, next) => {
    res.status(200).json({"message": "request succeeded"});
}

function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}
