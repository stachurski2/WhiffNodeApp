var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'stachurski2@gmail.com',
    pass: 'qgzpfabmrqrpdrpg'
  }
});

class Messenger {
  
    static sendEmail(adress, title, text) {
        var mailOptions = {
            from: 'noreply@whiff.zone',
            to: adress,
            subject: title,
            text: text
        };
        return transporter.sendMail(mailOptions)
    }
}

exports.messenger = Messenger;
