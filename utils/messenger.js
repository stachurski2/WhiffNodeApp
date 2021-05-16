var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  host: "smtp.zenbox.pl",
  port: 587,
  secure: false,
  auth: {
    user: "noreply@whiff.zone",
    pass: "xHT2lnNhN#FP"
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
