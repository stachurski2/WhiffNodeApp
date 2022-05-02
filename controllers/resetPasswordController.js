
const User = require("../model/user");

exports.getResetPasswordForm = (req, res, next) => {
    if(req.query.secret) {
        return User.findOne({ where: { resetPasswordKey: req.query.secret }}).then( user => {
            if(user) {
                 res.status(200).render('resetPassword', {secret: req.query.secret, email: user.email});
            }
            res.status(403).json({"message": "Didn't find requested user"});
        })
    } 
    res.status(401).json({"message": "No rights to this operation"});
}

